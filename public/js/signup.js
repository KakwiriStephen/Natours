import axios from 'axios';
import { showAlert } from './alert';

export const signup = async(name, email, password, passwordconfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordconfirm,
            },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Welcome to Natours Family!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};