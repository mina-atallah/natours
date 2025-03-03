const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review can not be empty'] },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// compound index to prevent duplicate reviews by making the combination of tour and user to be unique
reviewSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true
  }
);

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};

reviewSchema.pre(/^find/, function(next) {
  // two queries
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.post('save', function() {
  // using the static method on the current review doc (this ==> current document)
  // this.construcotr.calcAverageRatings(this.tour) ==> does not work on post middleware;
  this.model('Review').calcAverageRatings(this.tour);
});

/*
 * findByIdAndUpdate & findByIdAndDelete
 * ==> both gets converted to findOneAnd(ACTION)
 */
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // create 'r' which means review to pass to the next query-middleware
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  } else {
    console.log('No review found to update.');
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
