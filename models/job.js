var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var JobSchema = new Schema(
  {
    organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
    name: {type: String, required: true},
    description: {type: String, required: false}
  }
);

// Virtuals
JobSchema
  .virtual('url')
  .get(function() {
    return '/organizations/job/' + this._id;
  });

module.exports = mongoose.model('Job', JobSchema);