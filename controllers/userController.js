const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterRequestBody = (requestBody, ...allowedFields) => {
  const newBodyObject = {};
  Object.keys(requestBody).forEach(field => {
    if (allowedFields.includes(field)) {
      newBodyObject[field] = requestBody[field];
    }
  });
  return newBodyObject;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  // const users = await User.find({ active: { $ne: false } });
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'this route is not defined yet'
  });
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

  // 2- Filter the data coming from the request
  const filteredBody = filterRequestBody(req.body, 'name', 'email');

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

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'this route is not defined yet'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'this route is not defined yet'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'this route is not defined yet'
  });
};
