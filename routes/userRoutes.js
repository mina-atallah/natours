const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

/*
 * 
  Special case does not fit REST philosphy
 */
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
// Reset Password
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

/*
  all routes comes after this middleware will be Protected
*/
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword); //current user wants to update their password
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
); // current user wants to update some of their data
router.get('/me', userController.getMe, userController.getUser);
router.delete('/deleteMe', userController.deleteMe); // current user wants to delete their account

/*
  all routes comes after this middleware will be Restricted to everyone except admins after being protected first = (the logged-in user is known)
*/
router.use(authController.restrictTo('admin'));
// REST
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
