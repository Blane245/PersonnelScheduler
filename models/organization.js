var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var OrganizationSchema = new Schema(
  {
      name: {type: String, required: true},
      description: {type: String, required: true}
      
  }
);

// Virtuals
OrganizationSchema
  .virtual('url')
  .get(function() {
    return '/organizations/organization' + this._id;
  });

module.exports = mongoose.model('Organization', OrganizationSchema);