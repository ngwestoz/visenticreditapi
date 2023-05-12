const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true, 
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    unique: true,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  dob: {
    type: Date,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  idNum: {
    type: Number,
    default: ''
  },
  password: {
    type: String,
    required: true, 
  },
});
 
const User = mongoose.model('User', userSchema);

module.exports = { User };
