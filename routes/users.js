const axios = require('axios');
const https = require('https');
var btoa = require('btoa');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User, otp } = require('../models/models');

// Login controller
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;
  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return res.status(401).json({ message: 'Invalid phone number or password' });
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid phone number or password' });
  }
  // Successful login
  return res.status(200).json({ message: 'Login successful' });
});

// Register controller
router.post('/register', async (req, res) => {
  const { phoneNumber, password, otpCode } = req.body;

  const existingUser = await User.findOne({ phoneNumber });
  if (existingUser) {
    return res.status(400).json({ message: 'Phone number is already registered' });
  }
  const existingOtp = await otp.findOne({ phone_number: phoneNumber, otp: otpCode, isVerified: false, expiredAt: { $gt: new Date() } });
  if (!existingOtp) {
    return res.status(400).json({ message: 'Invalid or expired OTP code' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ phoneNumber, password: hashedPassword });
  await newUser.save();
  await otp.findOneAndUpdate({ phone_number: phoneNumber, otp: otpCode }, { isVerified: true });
  // Successful registration
  return res.status(201).json({ message: 'Registration successful', newUser });
});

// OTP creation controller
router.post('/otp', async (req, res) => {
  const { phoneNumber } = req.body;
  // Create new OTP for user
  const newOtp = new otp({ phone_number: phoneNumber });
  await newOtp.save();
  // Successful OTP creation

  const api_key = '0ddfa740c217ac7b';
  const secret_key = 'MGU5M2FkMmQxNTNmZjVkMjBmZDE5NWI3ZmQzOTJmZTZmYzgxYmYzODJhMDM1NWY0NDA1NmM5NTE1ZWZkYjlmNQ==';
  const content_type = 'application/json';
  const source_addr = 'INFO';

  axios
    .post(
      'https://apisms.beem.africa/v1/send',
      {
        source_addr: source_addr,
        schedule_time: '',
        encoding: 0,
        message: `Your OTP for Visenti Credit financial limited is ${newOtp.otp}`,
        recipients: [
          {
            recipient_id: 1,
            dest_addr: phoneNumber
          }
        ]
      },
      {
        headers: {
          'Content-Type': content_type,
          Authorization: 'Basic ' + btoa(api_key + ':' + secret_key)
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    )
    .then((response) => console.log('SMS', response, api_key + ':' + secret_key))
    .catch((error) => console.error('SMS ERROR', error.response.data));

  return res.status(200).json({ message: 'OTP created successfully', newOtp });
});

// Forgot password controller
router.post('/forgotPassword', async (req, res) => {
  const { phoneNumber, otpCode, newPassword } = req.body;
  const existingUser = await User.findOne({ phoneNumber });
  if (!existingUser) {
    return res.status(404).json({ message: 'Phone number not found' });
  }
  const existingOtp = await otp.findOne({ phone_number: phoneNumber, otp: otpCode, isVerified: false, expiredAt: { $gt: new Date() } });
  if (!existingOtp) {
    return res.status(400).json({ message: 'Invalid or expired OTP code' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await existingUser.updateOne({ password: hashedPassword });
  await otp.findOneAndUpdate({ phone_number: phoneNumber, otp: otpCode }, { isVerified: true });
  // Password reset successful
  return res.status(200).json({ message: 'Password reset successful' });
});

module.exports = router;
