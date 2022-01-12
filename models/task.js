var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var TaskSchema = new Schema(
  {
    job: {type: Schema.Types.ObjectId, ref: 'Job', required: true},
    name: {type: String, required: true},
    description: {type: String, required: false},
    startDateTime: {type: Date, required: true},
    endDateTime: {type: Date, required: true},
    roles: [{type: Schema.Types.ObjectId, ref: 'Role'}],
    persons: [{type: Schema.Types.ObjectId, ref: 'Person'}]
  }
);

// Virtuals
TaskSchema
    .virtual('url')
    .get(function() {
    return '/jobs/task/' + this._id;
});
TaskSchema
.virtual('startDateTime_formatted')
.get(function() {
return DateTime.fromJSDate(this.startDateTime, {zone:'UTC'}).toISO({ suppressMilliseconds: true, includeOffset: false});
});
TaskSchema
.virtual('endDateTime_formatted')
.get(function() {
  return DateTime.fromJSDate(this.endDateTime, {zone:'UTC'}).toISO({ suppressMilliseconds: true, includeOffset: false});
});

module.exports = mongoose.model('Task', TaskSchema);