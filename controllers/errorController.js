const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.keyValue.name;

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid Input Data ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please login Again', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        Error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErorProd = (err, req, res) => {
    //Operational, trusted errors: send mesage to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    //programming or other unknown errors: dont leak error details
    else {
        //1 log error
        // console.error('ERROR🎆', err)

        //2 Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong',
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {...err };
        error.name = err.name;
        if (err.name === 'castError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'validatorError') error = handleValidationErrorDB(error);

        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
        sendErorProd(error, req, res);
    }
};