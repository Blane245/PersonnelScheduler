var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var LeaveSchema = new Schema(
  {
    person: {type: Schema.Types.ObjectId, ref: 'Person', required: true},
    name: {type: String, required: true},
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: false},
  }
);

// Virtuals
LeaveSchema
  .virtual('url')
  .get(function() {
    return '/leave/' + this._id;
  });

  LeaveSchema
  .virtual('startDate_formatted')
  .get(function() {
    return DateTime.fromJSDate(this.startDate, {zone:'UTC'}).toFormat('yyyy-MM-dd');
  });
LeaveSchema
.virtual('endDate_formatted')
.get(function() {
  if (this.endDate == null)
    return '';
  else
    return DateTime.fromJSDate(this.endDate, {zone:'UTC'}).toFormat('yyyy-MM-dd');
});
LeaveSchema
  .virtual('startDate_formatted_extend')
  .get(function() {
    return DateTime.fromJSDate(this.startDate, {zone:'UTC'}).toFormat('yyyy-MM-ddT00:00:00');
  });
LeaveSchema
.virtual('endDate_formatted_extend')
.get(function() {
  if (this.endDate == null)
    return '';
  else
    return DateTime.fromJSDate(this.endDate, {zone:'UTC'}).toFormat('yyyy-MM-ddT00:00:00');
});
module.exports = mongoose.model('Leave', LeaveSchema);