// TODO implement checks for children before allowing delete (organization, person, role, job)
// TODO check for relationships before allowing modify and delete (job/role, person/task)
// TODO start and end dates 'walking'
// TODO enddate greater than start date validation
// TODO normalize list pages - table format
// TODO - implement copy function for job to replicate another one with roles
// TODO - implement move role up and down job list
// TODO add cancel buttons to modify and delete
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var organizationRouter = require('./organization/routes/organization.js');
var jobRouter = require('./job/routes/job.js');
var roleRouter = require('./role/routes/role.js');
var trainingRouter = require('./training/routes/training.js');
var personRouter = require('./person/routes/person.js');
var taskRouter = require('./task/routes/task.js');
var app = express();

//pug view engine setup
app.set('views', [
  path.join(__dirname, 'views'), 
  path.join(__dirname, 'organization/views'),
  path.join(__dirname, 'job/views'),
  path.join(__dirname, 'role/views'),
  path.join(__dirname, 'training/views'),
  path.join(__dirname, 'person/views'),
  path.join(__dirname, 'task/views')
]);
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// router tables
app.use('/', indexRouter);
app.use('/organizations', organizationRouter );
app.use('/jobs', jobRouter );
app.use('/roles', roleRouter );
app.use('/trainings', trainingRouter );
app.use('/persons', personRouter );
app.use('/tasks', taskRouter );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404, 'Page not found: ' + req.url ));
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

module.exports = app;
  
