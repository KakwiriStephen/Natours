/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
const stripe = stripe(
    'pk_test_51LzIJFKEDZNBrO6r5DcYEFoqRHiLruChpXVJw0Ev03Nc8izulLiqlzFGa13eL4k2tuRxAYUMSFQZtmQvrnijbClQ00VhcaXemX'
);

export const bookTour = async(tourId) => {
    try {
        //1)get checkout session from Api
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );
        //2) create checkout form
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};