var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TrainingSchema = new Schema(
  {
    name: {type: String, required: true},
    description: {type: String, required: false}
  }
);

// Virtuals
TrainingSchema
  .virtual('url')
  .get(function() {
    return '/training/' + this._id;
  });

module.exports = mongoose.model('Training', TrainingSchema);