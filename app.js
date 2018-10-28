var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socket_io = require('socket.io');

var app = express();

// Socket.io
var io = socket_io();
app.io = io;

var indexRouter = require('./routes/index')(io);
var usersRouter = require('./routes/users');

var mongoose = require('mongoose');

// url to mongodb server hosted on AWS
var mongoDB = "mongodb://34.209.5.212:27017/CAB432-MongoDB";

// Establish connection to MongoDB
mongoose.connect(mongoDB, { useNewUrlParser: true }, function(err, db) {
	if (!err) {
		console.log('Connected to MongoDB');
	}
});

mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// set routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/twitter-results', indexRouter);
app.use('/trending-tags', indexRouter);

// socket io event
io.on('connection', function (socket) {
	console.log('Socket.io: Connected');
});

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

// debug check for eventemitter memory leak...  
//process.on('warning',  e => console.warn(e.stack));

//bad fix(?) - default capped at 10 listeners | 0 = infinite
//process.setMaxListeners(0); 
require('events').EventEmitter.prototype._maxListeners = 0;

module.exports = app;
