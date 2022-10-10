const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');

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
    //Bulid template

    //Render template

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
});