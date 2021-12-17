var Organization = require('../../models/organization');
var Role = require('../../models/role');
const { check, validationResult } = require('express-validator');
var async = require('async');
const organization = require('../../models/organization');

// the list of roles for an organization
exports.organization_role_list = function (req, res, next) {
    console.log('in Role_controller for organization '+req.params.orgid);
    async.parallel ({
        // get the organization object for this group of roles
        organization: function (callback) {
            Organization.findById(req.params.orgid).exec(callback);},
        // get the roles for this organization
        roles: function (callback) {
            Role.find({ 'organization': req.params.orgid })
            .populate('organization')
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        orgName = results.organization.name;
        var roles = results.roles;
        var n;
        if (roles == null)
            n = 0;
        else
            n = roles.length;
        
        console.log('orgname =' + orgName + ", count of roles " + n);
        res.render(
            '../role/views/role_list', 
            { title: "Role List for Organization '"+ orgName + "'",
             organization: results.organization, 
             role_list: results.roles });

    });

};

// Display role create form on GET.
exports.role_create_get = function(req, res, next) {
    var org = Organization.findById(req.params.orgId)
        .exec(function (err, org) {
        if (err) { return next(err);}
        res.render('role_form', { title: 'Create Role for Organzation "' + org.name + '"'});

    });
};
// Handle role create form on POST. Get the Organization whose key is in url
exports.role_create_post = [

    // validate and sanitize fields
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),
    // check('organization', '').escape(),
    // prevent a new role from having the same name as a current one

    // save the new role
    (req, res, next) => {

        // get the organization that this role is to belong to
        Organization.findById(req.params.orgId).exec(function(err, org) {
            if (err) { return next(err);}
            console.log('organization found for roles ' + org.id);
            req.body.orgId = org._id;
            req.body.orgName = org.name;
            req.body.org = org;
            console.log('Org in the req.body ' + req.body.org);

            // create an role object with escaped and trimmed data
            console.log('ready to create a new role object');
            var role = new Role (
                { name: req.body.name.trim(),
                    description: req.body.description.trim(),
                    organization: req.body.org
                });

            // Extract the validation errors from a request.
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                console.log('Error while saving role: ' + req.body.name);

                res.render('role_form', {
                    title: "Create Role for Organization'" + req.body.orgName + "'", 
                    name:req.body.name.trim(), 
                    description:req.body.description.trim(),
                    errors: errors.array() });
            } else {
                
                // data is valid and sanitized. save it
                console.log('saving role record');
                role.save(function (err) {
                    if (err) { return next (err);}
                    res.redirect('/roles/'+req.body.orgId);
                });
            }
        }
     );
}
];

// FIXME not passing org well between renders. problably in jobs as well. 
// Display role modify form on GET.
exports.role_modify_get = function(req, res, next) {
    async.parallel(
        {
            role: function(callback) {
                console.log('looking for role: ' + req.params.id);
                Role.findById(req.params.id).exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            if (results.role==null) {
                var err = new Error('Role not found');
                err.status = 404;
                return next(err);
            }
            res.render('role_form', { 
                title: 'Modify Role', 
                role: results.role
                });    
        }
    );

};

exports.role_modify_post = [
    // validate and sanitze fields.
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        // reload the role record to retrieve the organization
        Role.findById(req.params.id).exec(function(err, role) {
            if (err) { return next(err); }
            if (role==null) {
                var err = new Error('Role not found');
                err.status = 404;
                return next(err);
            }
            var org = role.organization;
            const errors = validationResult(req);
            var newRole = new Role (
                { name: req.body.name.trim(),
                description: req.body.description.trim(),
                organization: org,
                _id:req.params.id
                });
            
            if (!errors.isEmpty()) {
                res.render('role_form', {
                    title: 'Modify Role', 
                    role: newRole,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
                    if (err) { return next(err); }
                    res.redirect ('/roles/'+newRole.organization);

                });
            }
        });
        
 

    }


]

// Display role delete form on GET.
exports.role_delete_get = function(req, res, next) {

    async.parallel({
        role: function(callback) {
            Role.findById(req.params.id).exec(callback)
        },
        // organizations_books: function(callback) {
        //   Book.find({ 'organization': req.params.id }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.role==null) { // No results.
            res.redirect('/organizations');
        }
        req.body.org = results.role.organization;
        // Successful, so render.
        res.render('role_delete', { title: 'Delete role (without children checking)', role: results.role } );
    });

};

// Handle role delete on POST.
exports.role_delete_post = function(req, res, next) {

    async.parallel({
        role: function(callback) {
          Role.findById(req.params.id).exec(callback)
        },
        // organizations_books: function(callback) {
        //   Book.find({ 'organization': req.body.organizationid }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
            // role has no children. Delete object and redirect to the list of roles for its organization.
            Role.findByIdAndRemove(results.role.id, function deleterole(err) {
                if (err) { return next(err); }
                // Success - go to organization list
                res.redirect ('/roles/'+results.role.organization);
            })
        // }
    });
};