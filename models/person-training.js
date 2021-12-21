var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Person_TrainingSchema = new Schema(
  {
    person: {type: Schema.Types.ObjectId, ref: 'Person', required: true},
    training: {type: Schema.Types.ObjectId, ref: 'Training', required: true},
    expirationDate: {type: Date, required: true},
  }
);

// Virtuals
Person_TrainingSchema
  .virtual('url')
  .get(function() {
    return '/organizations/persontraining/' + this._id;
  });
  Person_TrainingSchema
  .virtual('expirationDate_formatted')
  .get(function() {
    return DateTime.fromJSDate(this.expirationDate).toFormat('yyyy-MM-dd');
  });
module.exports = mongoose.model('Person_Training', Person_TrainingSchema);