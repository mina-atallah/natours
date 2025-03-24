/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const updateData = async (name, email) => {
  try {
    const response = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/updateMe`,
      data: {
        name,
        email
      }
    });

    if (response.data.status === 'success') {
      showAlert('success', 'data updated successfuly');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
