var _ = require('lodash');
var async = require('async');
var querystring = require('querystring');
var request = require('request');
var User = require('../models/User');
var Brand = require('../models/Brand');
var Answer = require('../models/Answer');
var UrlHistory = require('../models/UrlHistory');
var Background = require('../models/Background');
var secrets = require('../config/secrets');
var graph = require('fbgraph');

exports.getApi = function (req, res) {
  res.render('api/index', {
    title: 'Brands'
  });
};

exports.getBrand = function (req, res, next) {

  Brand.find(function (err, data) {
    if (err) return next(err);
    res.status('api/brands/index').json({
      result: data
    });
  });

};

exports.getUsers = function (req, res, next) {
  User
    .find()
    .select('-password -tokens')
    .populate('_urls _answers')
    .exec(function (err, data) {
      if (err) {
        return console.error(err);
      }
      console.log(data);
      res.status('/api/users/index').json({
        result: data
      });
    });
};

exports.postUser = function (req, res) {
  console.log(req.body);
  var user = new User({
    email: req.body.email,
    google: req.body.id
  });

  User.findOne({
    email: req.body.email
  }, function (err, existingUser) {
    if (existingUser) {
      console.log('Account with that email address already exists.');
      res.status(201).send(null);
    } else {
      user.save(function (err, post) {
        if (err) {
          console.error(err);
        }
        res.status(201).send(null);
        console.log(post);
      });
    }
  });
};

exports.postUrl = function (req, res) {
  // console.log(req.body.url);
  console.log('from ' + req.body.email);
  User.findOne({
    email: req.body.email
  }, function (err, existingUser) {
    if (existingUser) {
      console.log('exists');

      var urlData = new UrlHistory({
        _user: existingUser._id,
        url: req.body.url
      });
      urlData.save(function (err, post) {
        if (err) {
          console.error(err);
        }
        console.log('saving to existing');
        existingUser._urls.push(urlData);
        existingUser.save();
        res.status(201).send(null);
        console.log(post);
      });
    } else {
      var user = new User({
        email: req.body.email
      });
      user.save(function (err, post) {
        var urlData = new UrlHistory({
          _user: user.id,
          url: req.body.url
        });
        console.log('saving to new');
        user._urls.push(urlData);
        user.save();
        res.status(201).send(null);
        console.log(post);
      });
    }
  });
};

exports.postAnswer = function (req, res) {
  User.findOne({
    email: req.body.email
  }, function (err, existingUser) {
    if (existingUser) {
      existingUser.save(function (err) {
        if (err) {
          console.error(err);
        }
        var answer = new Answer({
          question: req.body.question,
          answer: req.body.answer,
          _user: existingUser._id // assign the _id from the person
        });
        answer.save(function (err, post) {
          if (err) {
            console.error(err);
          }
          existingUser._answers.push(answer);
          existingUser.save();
          res.status(201).send(null);
          console.log(post);
        });
      });
    } else {
      var user = new User({
        email: req.body.email
      });
      user.save(function (err, post) {
        if (err) {
          console.error(err);
        }
        var answer = new Answer({
          question: req.body.question,
          answer: req.body.answer,
          _user: user._id
        });
        answer.save(function (err, post) {
          if (err) {
            console.error(err);
          }
          user._answers.push(answer);
          user.save();
          res.status(201).send(null);
          console.log(post);
        });
      });
    }
  });
};

exports.postBrand = function (req, res, next) {

  var brand = new Brand({
    name: req.body.name,
    password: req.body.password
  });

  Brand.findOne({
    name: req.body.name
  }, function (err, existingBrand) {
    if (existingBrand) {
      req.flash('errors', {
        msg: 'Brand already exists.'
      });
      return res.redirect('/signup');
    }
    brand.save(function (err, post) {
      if (err) {
        return console.error(err);
      }
      res.status('api/brand').redirect('api/brands/index');
    });
  });
};

function postBackground(req, res, next) {
  var background = new Background({
    filename: req.body.filename,
    question: req.body.question
  });

  Brand.findOne({
    name: req.body.brand
  }, function (err, data) {
    if (err) {
      next(err);
    }
    res.redirect('api/brands/index');
  });
}

// facebook graph api
exports.getFacebook = function (req, res, next) {
  var token = _.find(req.user.tokens, {
    kind: 'facebook'
  });
  graph.setAccessToken(token.accessToken);
  async.parallel({
      getMe: function (done) {
        graph.get(req.user.facebook, function (err, me) {
          done(err, me);
        });
      },
      getMyFriends: function (done) {
        graph.get(req.user.facebook + '/friends', function (err, friends) {
          done(err, friends.data);
        });
      }
    },
    function (err, results) {
      if (err) return next(err);
      res.render('api/facebook', {
        title: 'Facebook API',
        me: results.getMe,
        friends: results.getMyFriends
      });
    });
};
