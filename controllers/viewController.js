const Tour = require('./../models/tourModel');
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

exports.getTourView = (req, res) => {
  res.status(200).render('tour', {
    title: 'the forest hiker'
  });
};
