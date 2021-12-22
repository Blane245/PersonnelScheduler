var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TaskSchema = new Schema(
  {
    job: {type: Schema.Types.ObjectId, ref: 'Job', required: true},
    name: {type: String, required: true},
    description: {type: String, required: false},
    startDate: {type: Date, required: true},
    endStart: {type: Date, required: true},
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
    return DateTime.fromJSDate(this.startDate).toFormat('yyyy-MM-dd');
});
TaskSchema
    .virtual('endDate_formatted')
    .get(function() {
    if (this.endDate == null)
        return '-';
    else
        return DateTime.fromJSDate(this.endDate).toFormat('yyyy-MM-dd');
});

module.exports = mongoose.model('Task', JobSchema);