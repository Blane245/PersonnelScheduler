var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PersonSchema = new Schema(
  {
    organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
    lastName: {type: String, required: true},
    firstName: {type: String, required: true},
    email: {type: String, match: /.+\@.+\..+/},
  }
);

// Virtuals
RoleSchema
  .virtual('url')
  .get(function() {
    return '/organizations/person/' + this._id;
  });
RoleSchema
  .virtual('fullName')
  .get(function() {
      return this.lastName + ', ' + this.firstName;
  });
module.exports = mongoose.model('Role', RoleSchema);