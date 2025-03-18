const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, response) => {
  const token = signToken(user._id);

  // Token Cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true // means we can not manipulate the cookie in the browser in anyway
  };

  if (process.env.NODE_ENV.trim() === 'production') {
    cookieOptions.secure = true;
  }

  response.cookie('jwt', token, cookieOptions);

  response.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        // id: user._id,
        // role: user.role,
        // username: user.username,
        // email: user.email, // Never return the password!
        // passwordChangedAt: user.passwordChangedAt
        user
      }
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // THIS IS A SERIOUS SECURITY FLAW BECAUSE ANYONE CAN TAKE AN ADMIN ROLE !// const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check email && password exist
  if (!email || !password) {
    return next(new AppError('Please provide email or password', 400));
  }

  //2) check if user exits && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); // statusCode => unauthorised
  }

  //3) if everything is ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'logged-out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting the token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // able to authenticate users based on tokens sent by cookies
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }
  // 2) Validate/Verification the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check of user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exists',
        401
      )
    );

  // 4) if user changes password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! please log in again', 401)
    );
  }

  /* Grant Access To Protected Route, if the code reached here */
  req.user = currentUser;
  next();
});

// isLoggedIn => is a middleware for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Validate/Verification the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check of user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) return next();

      // 3) if user changes password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      /* 
                          <-- There is a logged-in user --> 
      res.locals.user => whatever is being put into locals will be a variable accessable by the templates
    */
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
/* Authorization */
exports.restrictTo = (...roles) => {
  // roles is an array
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action ❗',
          403
        )
      );
    }
    next();
  };
};

/* Reset Password (3 steps) */

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is a user => set a new password
  if (!user) {
    return next(new AppError('Token is expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) update changedPasswordAt property for the current the user => done in the User Model
  // 4) log the user in (send the JWT to the client)
  createSendToken(user, 200, res);
  // const token = signToken(user._id); // fake token to test
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get User from collection
  const user = await User.findByI(req.user.id).select('+password');

  // 2) Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Incorrect Password', 401)); // statusCode => unauthorised
  }

  // 3) if password correct => update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log the user in (send JWT)
  createSendToken(user, 200, res);
});
