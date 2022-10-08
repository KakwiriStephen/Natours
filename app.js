const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewRouter = require('./Routes/reviewRoutes');

const app = express();

//Global Middlewares

// set security http headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//limit requests from same api
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again after one hour',
});
app.use('/api', limiter);

//Body parser, readin data from the body into rq.body
app.use(express.json({ limit: '10kb' }));

//data sanitazisation against NOSQL querry injection
app.use(mongoSanitize());

//Data sanitazisation against XSS
app.use(xss());

//prevent parameter solution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

//static files
app.use(express.static(`${__dirname}/public`));

//test middlewarw
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();

    next();
});

//    ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;