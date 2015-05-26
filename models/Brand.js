var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: String,
  logo: String,
  link: String,
  instagram: String,
  facebook: String,
  backgrounds: [{
    type: Schema.Types.ObjectId,
    ref: 'Background'
  }],
  fans: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Brand', BrandSchema);
