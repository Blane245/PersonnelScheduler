var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var LeaveSchema = new Schema(
  {
    person: {type: Schema.Types.ObjectId, ref: 'Person', required: true},
    name: {type: String, required: true},
    startDate: {type: Date, required: true},
    endDate: {type: Date},
    type: {type: String, required: true, enum: ['Temporary', 'Permanent'], default: 'Temporary'},
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
    return DateTime.fromJSDate(this.startDate).toLocaleString(DateTime.DATE_MED);
  });
LeaveSchema
.virtual('endDate_formatted')
.get(function() {
  return DateTime.fromJSDate(this.endDate).toLocaleString(DateTime.DATE_MED);
});
module.exports = mongoose.model('Leave', LeaveSchema);