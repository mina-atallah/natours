const Tour = require('./../models/tourModel');
// const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // 1)  Get All The Tours Data
  const tours = await Tour.find();
  // 2) Built Template
  // 3) Build this template using the tour data (from step-1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTourView = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  // handle error
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});

exports.getUserAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'your account'
  });
});

/*
// updating user info through form-action 
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email // name of attribute given by html-form
    },
    {
      new: true,
      runValidators: true
    }
  );
  // updatedUser.save();

  res.status(200).render('account', {
    title: 'your account',
    user: updatedUser
  });
});
*/
