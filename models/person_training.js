var mongoose = require('mongoose');
const { DateTime } = require("luxon");


var Schema = mongoose.Schema;

var Person_TrainingSchema = new Schema(
  {
    person: {type: Schema.Types.ObjectId, ref: 'Person', required: true},
    training: {type: Schema.Types.ObjectId, ref: 'Training', required: true},
    expirationDate: {type: Date, required: false},
  }
);

// Virtuals
Person_TrainingSchema
  .virtual('url')
  .get(function() {
    return '/organizations/person_training/' + this._id;
  });
  Person_TrainingSchema
  .virtual('expirationDate_formatted')
  .get(function() {
    if (this.expirationDate)
      return DateTime.fromJSDate(this.expirationDate, {zone:'UTC'}).toFormat('yyyy-MM-dd');
    else
      return "";
  });
  Person_TrainingSchema
.virtual('expirationDate_formatted_extend')
.get(function() {
  if (this.expirationDate)
    return DateTime.fromJSDate(this.expirationDate, {zone:'UTC'}).toFormat('yyyy-MM-ddT00:00:00');
  else
    return "";
});
module.exports = mongoose.model('Person_Training', Person_TrainingSchema);