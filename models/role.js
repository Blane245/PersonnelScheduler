var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var RoleSchema = new Schema(
  {
    organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
    name: {type: String, required: true},
    description: {type: String, required: false}
  }
);

// Virtuals
RoleSchema
  .virtual('url')
  .get(function() {
    return '/organizations/role/' + this._id;
  });

module.exports = mongoose.model('Role', RoleSchema);