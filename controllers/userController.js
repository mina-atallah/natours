const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');

// Config multer
/*
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/img/users');
    },
    filename: function(req, file, cb) {
      // user-1232445jas12ea-12345567635.jpeg
      const ext = file.mimetype.split('/')[1];
      cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    }
  });
*/
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only images', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
// middlewares for uploading user photo and processing it
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // generate unique filename
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // process image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterRequestBody = (requestBody, ...allowedFields) => {
  const newBodyObject = {};
  Object.keys(requestBody).forEach(field => {
    if (allowedFields.includes(field)) {
      newBodyObject[field] = requestBody[field];
    }
  });
  return newBodyObject;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1- Create Error if user POSTed password data;
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword',
        400
      )
    );

  // 2- Filter the data coming from the request, so that a normal user can not change their role from 'user' to 'admin'
  const filteredBody = filterRequestBody(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3- If not => Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  }).select('-_id');
  /*
    .save does not work in this case
  user.name = 'Aragorn';
  await user.save();
    */
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: 'account is deleted successfully',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'Go to /signup route'
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT Update password with this handler!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
