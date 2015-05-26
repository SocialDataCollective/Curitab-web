var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnswerSchema = new Schema({
  _user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  question: String,
  answer: String,
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Answer', AnswerSchema);
