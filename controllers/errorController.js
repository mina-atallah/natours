const AppError = require('../utils/appError');

/*
function cloneError(err) {
  const clonedError = Object.create(Object.getPrototypeOf(err)); // Keeps prototype
  Object.getOwnPropertyNames(err).forEach(key => {
    Object.defineProperty(
      clonedError,
      key,
      Object.getOwnPropertyDescriptor(err, key)
    );
  });
  return clonedError;
}
*/

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const value = err.keyValue.name;
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Expired Token. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  // For API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //For Error Rendered Pages
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // For API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
      // Programming or other unknown error: don't leak error details
    }
    console.log('Error 💥', err); // Log error in production

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
  if (err.isOperational) {
    //For Error Rendered Pages
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!'
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack); // Log the error
  // console.log('Error received in global handler: ✉', err.name); // Log the error received
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const NODE_ENV = process.env.NODE_ENV.trim();

  if (NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (NODE_ENV === 'production') {
    let error = new Error(err.message); // the message is carried over
    error.name = err.name;
    error.stack = err.stack;
    error.statusCode = err.statusCode;
    error.status = err.status;
    error.isOperational = err.isOperational;

    if (err.name === 'CastError') error = handleCastErrorDB(err);

    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    // console.log('Error object being sent to sendErrorProd:', error.message);

    sendErrorProd(error, req, res);
  }
};
