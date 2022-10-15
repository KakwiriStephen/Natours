const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
    return jwt.sign({
            id,
        },
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'Succes',
        token,
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordconfirm: req.body.passwordconfirm,
    });
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;

    //1)check if  email and password exist
    if (!email || !password) {
        return next(new AppError('Please enter email and password', 400));
    }

    //2)check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    //3) if everything is correct send token to user
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async(req, res, next) => {
    //1 getting and checking token if it exist
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    //2 veriy token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3 check if user exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError('The user belonging to this token no longer exist', 401)
        );
    }

    //4 check if user change password after token was isued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again', 401)
        );
    }

    //Grant Access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }

        next();
    };
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    //get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address', 400));
    }

    //generate random reset token
    const resetToken = user.createPasswordReset();
    await user.save({ validateBeforeSave: false });

    //send it to users id
    const resetURL = `${req.protocal}://${req.get(
    'host'
  )}/api/v1/users/restPassword/${resetToken}`;
    const message = `Forgot your password? submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\nIf you did not forget your password  please ignore this email`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Password reset is valid for the next 10 min',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'There was an error in sending the email.Try again later',
                500
            )
        );
    }
});

exports.resetPassword = catchAsync(async(req, res, next) => {
    //get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    //set new password if token has not expired and there's user
    if (!user) {
        return next(new AppError('Token is invalid or expired', 400));
    }

    user.password = req.body.password;
    user.passwordconfirm = req.body.passwordconfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //update changed password

    //log the user in
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async(req, res, next) => {
    //get user from collection
    const user = await User.findById(req.user.id).select('+password');

    //check if posted password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401));
    }

    //if so update password
    user.password = req.body.password;
    user.passwordconfirm = req.body.passwordconfirm;
    await user.save();

    //log user in, send Jwt
    createSendToken(user, 200, res);
});