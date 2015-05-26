var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UrlHistorySchema = new Schema({
  _user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  url: String,
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UrlHistory', UrlHistorySchema);
