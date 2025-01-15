const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: true,
    trim: true,
    maxlength: [35, 'A name must ne less than or equal to 35 characters']
    // minlength: [8, 'A name must ne more than or equal to 8 characters']
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please use a valid email!']
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead guide', 'admin'],
    default: 'user'
  },
  photo: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false // DO NOT SEND TO CLIENT
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE or SAVE!!!!!
      validator: function(ele) {
        return ele === this.password;
      },
      message: 'Password confirmation is not true'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

/* Middleware s*/
// Encrypt Password: receive => Encrypt => save to DB
userSchema.pre('save', async function(next) {
  // only run this function if passwprd was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete passwordConfirm field because it only required during the input but required when presisting into the DB
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// middleware happens before query find execution
userSchema.pre(/^find/, function(next) {
  // this points to the curr document
  this.find({ active: { $ne: false } });
  next();
});

/* Instance Methods (a method avaalable for all documents) */
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp; // 100 < 200
  }
  // No Change
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  // Generate the token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypt the token for the password that will be changed and store the token in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  // Token will be expired in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
