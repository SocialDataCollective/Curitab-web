var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  password: String,
  facebook: String,
  instagram: String,
  google: String,
  tokens: Array,
  _urls: [{
    type: Schema.ObjectId,
    ref: 'UrlHistory'
  }],
  _answers: [{
    type: Schema.ObjectId,
    ref: 'Answer'
  }],

  profile: {
    name: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
  }

});

userSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, null, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', userSchema);
