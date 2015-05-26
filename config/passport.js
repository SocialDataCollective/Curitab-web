var _ = require('lodash');
var passport = require('passport');
var InstagramStrategy = require('passport-instagram').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

var secrets = require('./secrets');
var User = require('../models/User');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'email'
}, function (email, password, done) {
  email = email.toLowerCase();
  User.findOne({
    email: email
  }, function (err, user) {
    if (!user) return done(null, false, {
      message: 'Email ' + email + ' not found'
    });
    user.comparePassword(password, function (err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {
          message: 'Invalid email or password.'
        });
      }
    });
  });
}));

// passport.use(new InstagramStrategy(secrets.instagram, function (req,
//   accessToken, refreshToken, profile, done) {
//   if (req.user) {
//     User.findOne({
//       instagram: profile.id
//     }, function (err, existingUser) {
//       if (existingUser) {
//         req.flash('errors', {
//           msg: 'There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
//         });
//         done(err);
//       } else {
//         User.findById(req.user.id, function (err, user) {
//           user.instagram = profile.id;
//           user.tokens.push({
//             kind: 'instagram',
//             accessToken: accessToken
//           });
//           user.profile.name = user.profile.name || profile.displayName;
//           user.profile.picture = user.profile.picture || profile._json
//             .data.profile_picture;
//           user.profile.website = user.profile.website || profile._json
//             .data.website;
//           user.save(function (err) {
//             req.flash('info', {
//               msg: 'Instagram account has been linked.'
//             });
//             done(err, user);
//           });
//         });
//       }
//     });
//   } else {
//     User.findOne({
//       instagram: profile.id
//     }, function (err, existingUser) {
//       if (existingUser) return done(null, existingUser);
//
//       var user = new User();
//       user.instagram = profile.id;
//       user.tokens.push({
//         kind: 'instagram',
//         accessToken: accessToken
//       });
//       user.profile.name = profile.displayName;
//       // Similar to Twitter API, assigns a temporary e-mail address
//       // to get on with the registration process. It can be changed later
//       // to a valid e-mail address in Profile Management.
//       user.email = profile.username + "@instagram.com";
//       user.profile.website = profile._json.data.website;
//       user.profile.picture = profile._json.data.profile_picture;
//       user.save(function (err) {
//         done(err, user);
//       });
//     });
//   }
// }));

// google
passport.use(new GoogleStrategy(secrets.google, function (req, accessToken,
  refreshToken, profile, done) {
  if (req.user) {
    User.findOne({
      google: profile.id
    }, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {
          msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
        });
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.google = profile.id;
          user.tokens.push({
            kind: 'google',
            accessToken: accessToken
          });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json
            .gender;
          user.profile.picture = user.profile.picture || profile._json
            .picture;
          user.save(function (err) {
            req.flash('info', {
              msg: 'Google account has been linked.'
            });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({
      google: profile.id
    }, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);
      User.findOne({
        email: profile.emails[0].value
      }, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {
            msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.'
          });
          done(err);
        } else {
          var user = new User();
          user.email = profile.emails[0].value;
          user.google = profile.id;
          user.tokens.push({
            kind: 'google',
            accessToken: accessToken
          });
          user.profile.name = profile.displayName;
          user.profile.gender = profile._json.gender;
          user.profile.picture = profile._json.picture;
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

exports.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

exports.isAuthorized = function (req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, {
      kind: provider
    })) {
    next();
  } else {
    res.redirect('/auth/' + provider);
  }
};
