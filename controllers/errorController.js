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

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            Error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }
};

const sendErorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
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
            return res.status(500).json({
                status: 'error',
                message: 'Something went very wrong',
            });
        }
    }
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }
    //programming or other unknown errors: dont leak error details

    //1 log error
    // console.error('ERROR🎆', err)

    //2 Send generic message
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later',
    });

    //Operational, trusted errors: send mesage to client
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {...err };
        error.message = err.message;
        if (err.name === 'castError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'validatorError') error = handleValidationErrorDB(error);

        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
        sendErorProd(error, req, res);
    }
};