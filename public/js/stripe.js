/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
    'pk_test_51LzIJFKEDZNBrO6r5DcYEFoqRHiLruChpXVJw0Ev03Nc8izulLiqlzFGa13eL4k2tuRxAYUMSFQZtmQvrnijbClQ00VhcaXemX'
);

export const bookTour = async(tourId) => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);

        // 2) Create checkout form + chanre credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};