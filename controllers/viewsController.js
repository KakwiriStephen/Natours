const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModels');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async(req, res) => {
    //get tour data from collection
    const tours = await Tour.find();

    //Build template

    //Render that template usig tour data

    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    });
});

exports.getTour = catchAsync(async(req, res, next) => {
    //get data for the requsted tour including reviews and guides
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) {
        return next(new AppError('There is no tour with this name', 404));
    }
    //Bulid template

    //Render template

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account',
    });
};

exports.getSignupForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'signup to create account',
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = catchAsync(async(req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});

exports.updateUserData = catchAsync(async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,

        {
            name: req.body.name,
            email: req.body.email,
        }
    );
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser,
    });
});