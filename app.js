// dependencies
var express = require('express');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var _ = require('lodash');
var logger = require('morgan');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

// config settings
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');
var app = express();

// controllers
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');

// connect to db
mongoose.connect(secrets.db, function () {
  console.log('MongoDB connected to ' + secrets.db);
});
mongoose.connection.on('error', function () {
  console.error(
    'MongoDB Connection Error. Please make sure that MongoDB is running.'
  );
});

// configure express
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors());
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname,
    'public/js')]
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'sssshhhhh',
  store: new MongoStore({
    url: secrets.db,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use(lusca({
//   csrf: true,
//   xframe: 'SAMEORIGIN',
//   xssProtection: true
// }));
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function (req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 31557600000
}));
// user routes
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);

// passport
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
// app.get('/account/unlink/:provider', passportConf.isAuthenticated,
// userController.getOauthUnlink);

// api data routes
app.get('/api', apiController.getApi);
app.get('/api/brands/index', apiController.getBrand);
app.get('/api/users/index', apiController.getUsers);
app.post('/api/answer', apiController.postAnswer);
app.post('/api/user', apiController.postUser);
app.post('/api/url', apiController.postUrl);
// app.post('/api/brand/question', apiController.postBackground);

// api content routes

app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized,
  apiController.getFacebook);
app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized,
  apiController.getInstagram);

// oAuth signin routes
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', {
  failureRedirect: '/login'
}), function (req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', {
  scope: 'profile email'
}));
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), function (req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', {
  scope: ['email', 'user_location']
}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: '/login'
}), function (req, res) {
  res.redirect(req.session.returnTo || '/');
});

// error handling
app.use(errorHandler());

// start Express server
app.listen(app.get('port'), function () {
  console.log('Express server listening on port %d in %s mode', app.get(
    'port'), app.get('env'));
});

module.exports = app;
