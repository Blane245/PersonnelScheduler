var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var organizationRouter = require('./organization/routes/organization.js');
var app = express();
console.log('starting index.js');

//pug view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// router tables
app.use('/', indexRouter);
app.use('/organizations', organizationRouter );
console.log('routes established ');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  
  //Set up mongoose connection
  
  const mongoose = require('mongoose');
  //const url = "mongodb+srv://blane2245:wmozart@cluster0.7vveb.mongodb.net/personnel_scheduler?retryWrites=true&w=majority";
  const url = "mongodb://localhost"
  mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
  mongoose.Promise = global.Promise;
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  console.log('index is ready');
  module.exports = app;
  
