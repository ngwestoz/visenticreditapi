const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^(\+255)\d{9}$/ // Ensure phone number matches the format +255XXXXXXXXX
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  }
});

const otpSchema = mongoose.Schema(
  {
    phone_number: {
      type: String,
      required: true
    },
    otp: {
      type: Number,
      default: () => Math.floor(100000 + Math.random() * 900000)
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    expiredAt: {
      type: Date,
      default: () => Date.now() + 5 * 60 * 1000
    }
  },
  {
    timestamps: true
  }
);

const otp = mongoose.model('otps', otpSchema);
const User = mongoose.model('User', userSchema);

module.exports = { User, otp };
