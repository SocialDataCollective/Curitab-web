var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');

exports.getLogin = function (req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/login', {
    title: 'Login'
  });
};

exports.postLogin = function (req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }
  var user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({
    email: req.body.email
  }, function (err, existingUser) {
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      return res.redirect('/signup');
    }
    user.save(function (err) {
      if (err) return next(err);
      req.logIn(user, function (err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  });
};

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
};

exports.getSignup = function (req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Create Account'
  });
};

exports.postSignup = function (req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(
    4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body
    .password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  var user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({
    email: req.body.email
  }, function (err, existingUser) {
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      return res.redirect('/signup');
    }
    user.save(function (err) {
      if (err) return next(err);
      req.logIn(user, function (err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  });
};

exports.postUpdateProfile = function (req, res, next) {
  User.findById(req.user.id, function (err, user) {
    if (err) return next(err);
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';

    user.save(function (err) {
      if (err) return next(err);
      req.flash('success', {
        msg: 'Profile information updated.'
      });
      res.redirect('/account');
    });
  });
};

exports.postDeleteAccount = function (req, res, next) {
  User.remove({
    _id: req.user.id
  }, function (err) {
    if (err) return next(err);
    req.logout();
    req.flash('info', {
      msg: 'Your account has been deleted.'
    });
    res.redirect('/');
  });
};

exports.getAccount = function (req, res) {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

exports.postUpdatePassword = function (req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function (err, user) {
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function (err) {
      if (err) return next(err);
      req.flash('success', {
        msg: 'Password has been changed.'
      });
      res.redirect('/account');
    });
  });
};
exports.getOauthUnlink = function (req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function (err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function (token) {
      return token.kind === provider;
    });

    user.save(function (err) {
      if (err) return next(err);
      req.flash('info', {
        msg: provider + ' account has been unlinked.'
      });
      res.redirect('/account');
    });
  });
};
