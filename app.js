const express = require('express');
const mongoose = require('mongoose'); //require mongoose library functionality
const morgan = require('morgan'); // better debugging
 

const cors = require('cors');
// allow using a .env file
require('dotenv').config(); //require the dotenv

// creates a new instance of express application
const app = express();

// add cors header to the server
app.use(
  cors({
    origin: '*'
  })
);

mongoose.set('strictQuery', false);
// sets up mongoose for the mongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Database connection Success!');
  })
  .catch((err) => {
    console.error('Mongo Connection Error', err);
  });


// declare port number for the api
const PORT = process.env.PORT || 5000;

// setup and access request body
app.use(express.json());
app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));

// setup middle ware for routes
app.use('/users', require('./routes/users'));

app.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});

// error handler
app.use(function (err, req, res, next) {
  // logs error and error code to console
  // console.error(err.message, req);
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  res.status(err.statusCode).send(err.message);
});
