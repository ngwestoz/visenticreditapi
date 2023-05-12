const axios = require('axios');
const https = require('https');
var btoa = require('btoa');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const JWT_RESET_KEY = "jwtreset987";   

const { User } = require('../models/models');

const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// Login controller
router.post("/login", async (req, res) => {  
  try { 
    const user = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (!user) {
      return res
        .status(200)
        .send({ message: "user not found", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) { 
      return res
        .status(200)
        .send({ message: "Invlid Email or Password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    
    return res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) { 
    res.status(500).send({ message: `Error in Login CTRL ${error.message}` });
  }
});

// Register controller
router.post('/sign-up', async (req, res) => {
  try { 
    const existingUser = await User.findOne({ 
      $or: [
        { phoneNumber: req.body.phoneNumber },
        { email: req.body.email }
      ]  
    });
    if (existingUser) {
      return res.status(200).send({
        message: "PhoneNumber or Email already exist",
        success: false,
      });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
 
    const newUser = new User(req.body);
    await newUser.save();
     
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
     
    return res.status(201).json({ message: 'Registration successful', newUser, token });
     
    
  } catch (error) {
    res.status(500).send({
      success: false,
      message: `register controller ${error.message}`,
    });
  }
});


//Forgot Password Handle
router.post('/forgot-password', async (req, res) => {
    const email = req.body.email; 
        User.findOne({email: email}).then(user => {
            if (!user) {
                return res
                  .status(200)
                  .send({ message: "Email is Not Register", success: false });
            } else {
                const oauth2Client = new OAuth2(
                    "683638154302-crjh2p8n1vktu1rlc2tjgmj3cjlg6i1k.apps.googleusercontent.com", // ClientID
                    "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", // Client Secret
                    "https://developers.google.com/oauthplayground" // Redirect URL
                );
  
                oauth2Client.setCredentials({
                    refresh_token: "1//04O1yiNPCEo0rCgYIARAAGAQSNwF-L9IrbJ83vuwQMnAve_oO6eLelD6eSQ1R4cJ8drM_qWtxGiZwSwBLTesEJZm-u_Hok1tEoNQ"
                });
                const accessToken = oauth2Client.getAccessToken()
  
                const token = jwt.sign({ _id: user._id }, JWT_RESET_KEY, { expiresIn: '30m' });
                const CLIENT_URL = 'http://' + req.headers.host;
                const output = `
                <h2>Client Please click on below link to reset your account password</h2>
                <p>${CLIENT_URL}/users/reset-password/${token}</p>
                <p><b>NOTE: </b> The activation link will expire in 30 minutes.</p>
                `;
  
                User.updateOne({ resetLink: token }, (err, success) => {
                    if (err) {
                      return res
                      .status(200)
                      .send({ message: "Error Resetting Password", success: false });
                    }
                    else {
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                type: "OAuth2",
                                user: "visenticredit@gmail.com",
                                clientId: "683638154302-crjh2p8n1vktu1rlc2tjgmj3cjlg6i1k.apps.googleusercontent.com",
                                clientSecret: "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",
                                refreshToken: "1//04O1yiNPCEo0rCgYIARAAGAQSNwF-L9IrbJ83vuwQMnAve_oO6eLelD6eSQ1R4cJ8drM_qWtxGiZwSwBLTesEJZm-u_Hok1tEoNQ",
                                accessToken: accessToken
                            },
                        });
  
                        // send mail with defined transport object
                        const mailOptions = {
                            from: '"VisentiCredit" <visenticredit@gmail.com>', // sender address
                            to: email, // list of receivers
                            subject: "Account Password Reset: Visenti Credit Auth ✔", // Subject line
                            html: output, // html body
                        };
  
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                              console.log(error);
                              return res
                                .status(200)
                                .send({ message: "Something went wrong. Please try again later", success: false });
                            }
                            else {
                                console.log('Mail sent : %s', info.response);
                                return res.status(201).json({ message: 'Password Reset Mail send successful', info });
                            }
                        })
                    }
                })
  
            }
        }); 
});

//Reset Password Handle
router.get('/reset-password/:token', (req, res) => { 
    const { token } = req.params; 
    if (token) {
        jwt.verify(token, JWT_RESET_KEY, (err, decodedToken) => {
            if (err) {
                console.log("Incorrect or Expired link! Please try again.");
                return res
                    .status(200)
                    .send({ message: "Incorrect or expired link! Please try again", success: false });
            }
            else {
                const { _id } = decodedToken;
                User.findById(_id, (err, user) => {
                    if (err) {
                        console.log("User with email ID does not exist! Please try again.");
                        return res
                          .status(200)
                          .send({ message: "User with email ID does not exist! Please try again", success: false });
                    }
                    else {
                      res.render("resetPass", {email: user.email, status: "Not Verified"});
                    }
                })
            }
        })
    }
    else {
      return res
        .status(200)
        .send({ message: "Password Reset Error", success: false });
    }
});

//Reset Password Handle
router.post('/reset-password/:token', (req, res) => { 
    const { token } = req.params; 
    const { password, confirmPassword } = req.body;
    if(password !== confirmPassword){
      return res
          .status(200)
          .send({ message: "Password and Confirm Password must be same!", success: false });
    }
    if (token) {
        jwt.verify(token, JWT_RESET_KEY, (err, decodedToken) => {
            if (err) {
                console.log("Incorrect or Expired link! Please try again.");
                return res
                    .status(200)
                    .send({ message: "Incorrect or expired link! Please try again", success: false });
            }
            else {
                const { _id } = decodedToken;
                bcryptjs.genSalt(10, (err, salt) => {
                  bcryptjs.hash(password, salt, (err, hash) => {
                      if (err) {
                        return res
                          .status(200)
                          .send({ message: "Something went wrong, Please try again!", success: false });
                      } 
        
                      User.findByIdAndUpdate(
                          { _id: _id },
                          { password: hash },
                          function (err, user) {
                              if (err) {
                                  console.log("Error resetting password!");
                                  return res
                                    .status(200)
                                    .send({ message: "Error Resetting Password", success: false });
                              } else {
                                  console.log("Password reset successfully!");
                                  res.render("resetPass", {email: user.email, status: "Verified"});
                              }
                          }
                      );
        
                  });
              });   
            }
        })
    }
    else {
      return res
        .status(200)
        .send({ message: "Password Reset Error", success: false });
    }
});


module.exports = router;
