var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var TaskSchema = new Schema(
  {
    job: {type: Schema.Types.ObjectId, ref: 'Job', required: true},
    name: {type: String, required: true},
    description: {type: String, required: false},
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
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
    .virtual('startDate_formatted')
    .get(function() {
    return DateTime.fromJSDate(this.startDate, {zone:'UTC'}).toFormat('yyyy-MM-dd');
});
TaskSchema
    .virtual('endDate_formatted')
    .get(function() {
      return DateTime.fromJSDate(this.endDate, {zone:'UTC'}).toFormat('yyyy-MM-dd');
});

module.exports = mongoose.model('Task', TaskSchema);