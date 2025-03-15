const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

/* Set Pug engine */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/* 1) GLOBAL MIDDLEWARES */
// Serving Static Files.
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headres
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'"],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          '*.tile.openstreetmap.org', // Allow map tiles
          '*.openstreetmap.fr' // Optional for some tile servers
        ]
      }
    }
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request
const limiter = rateLimit({
  limit: 100, // 100 request per hour (windowMS)
  windowMS: 60 * 60 * 1000,
  message: 'Too may request from this IP. Please try again in an hour'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// After reading data coming from req.body => Data Sanitization:
/*
 * against NoSql query injection && against XSS
 */
app.use(mongoSanitize());
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsAverage',
      'ratingsQuantity'
    ]
  })
);

// TEST middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/* 3) ROUTES */
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
