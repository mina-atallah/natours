// module.exports = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch((err) => {
//       console.log('Error caught by catchAsync:', err);
//       next(err); // Pass the error to the next middleware (global error handler)
//     });
//   };
// };
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
