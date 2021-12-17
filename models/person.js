var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PersonSchema = new Schema(
  {
    organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
    lastName: {type: String, required: true},
    firstName: {type: String, required: true},
    email: {type: String},
  }
);

// Virtuals
PersonSchema
  .virtual('url')
  .get(function() {
    return '/organizations/person/' + this._id;
  });
PersonSchema
  .virtual('fullName')
  .get(function() {
      return this.lastName + ', ' + this.firstName;
  });
module.exports = mongoose.model('Person', PersonSchema);