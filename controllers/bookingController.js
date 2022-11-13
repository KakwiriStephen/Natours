const stripe = require('stripe')(
    'sk_test_51LzIJFKEDZNBrO6r3jmG2dEmEhvmGMJFwK4FKHV7vep4whbjU9YVwKOBvCtS7NU3ZY3AiS8UCVqmiGshXRL8802W00zoP4VFTR'
);
const Tour = require('./../models/tourModels');
const User = require('./../models/userModels');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async(req, res, next) => {
    // 1) Get the coy booked tour
    const tour = await Tour.findById(req.params.tourId);
    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${tour.name} Tour`,
                    description: tour.summary,
                    images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                },
                unit_amount: tour.price * 100,
            },
            quantity: 1,
        }, ],
        mode: 'payment',
    });

    // 3) Create session as as response
    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    //TEMPORARY,
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);