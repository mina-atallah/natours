const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

/* Special case does not fit REST philosphy */
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Reset Password
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// current user wants to update their password
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
router.patch('/updateMe', authController.protect, userController.updateMe); // current user wants to update some of their data
router.delete('/deleteMe', authController.protect, userController.deleteMe); // current user wants to delete their account

// REST
router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead guide'),
    userController.getAllUsers
  )
  .post(authController.restrictTo, userController.createUser);
router
  .route('/:id')
  .get(authController.restrictTo, userController.getUser)
  .patch(authController.restrictTo, userController.updateUser)
  .delete(authController.restrictTo, userController.deleteUser);

module.exports = router;
