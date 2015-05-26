var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BackgroundSchema = new Schema({
  _brand: [{
    type: Schema.ObjectId,
    ref: 'Brand'
  }],
  filename: String,
  question: String,
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Background', BackgroundSchema);
