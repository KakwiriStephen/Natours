const express = require('express');
const viewsController = require('../controllers/viewsController');
const router = express.Router();
const authController = require('../controllers/authController');

//    ROUTES

router.get('/', viewsController.getOverview);

router.get('/tour/:slug', authController.protect, viewsController.getTour);

router.get('/login', viewsController.getLoginForm);

router.get('/signup', viewsController.getSignupForm);

module.exports = router;