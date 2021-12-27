var Organization = require('../../models/organization');
var Role = require('../../models/role');
const Training = require('../../models/training');
const { check, validationResult } = require('express-validator');
var async = require('async');
const { training_list } = require('../../training/controllers/trainingController');

// the list of roles for an organization
exports.organization_role_list = function (req, res, next) {
    async.parallel ({
        // get the organization object for this group of roles
        organization: function (callback) {
            Organization.findById(req.params.orgId).exec(callback);},
        // get the roles for this organization
        roles: function (callback) {
            Role.find({ 'organization': req.params.orgId })
            .populate('organization')
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        res.render(
            '../role/views/role_list', 
            { title: "Role List for Organization '"+ results.organization.name + "'",
             organization: results.organization,
             role_list: results.roles });

    });

};

// Display role create form on GET.
exports.role_create_get = function(req, res, next) {
    Organization.findById(req.params.orgId)
        .exec(function (err, org) {
        if (err) { return next(err);}
        res.render('role_form', { 
            title: 'Create Role for Organzation "' + org.name + '"',
            org: org});

    });
};
// Handle role create form on POST. Get the Organization whose key is in url
exports.role_create_post = [

    // validate and sanitize fields
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),

    // save the new role unless the name is not unique within the organization
    (req, res, next) => {
        var errors = validationResult(req).array();

        // get the organization that this role is to belong to
        Organization.findById(req.params.orgId).exec(function(err, org) {
            if (err) { return next(err);}


            // check for duplicate role in this organization
            Role.findOne({'name': req.body.name, 'organization': req.params.orgId}).exec (function (err, role) {
                if (err) { return next(err)};
                if (role) {
                    errors.push({msg: 'A role with this name already exist for this organization.'});
                }

                // create an role object with escaped and trimmed data
                var newRole = new Role ({ 
                    name: req.body.name,
                    description: req.body.description,
                    organization: req.params.orgId
                });

                // redisplay on errors
                if (errors.length !=0) {
                    res.render('role_form', {
                        title: "Create Role for Organization'" + org.name + "'", 
                        role: newRole, 
                        org: org,
                        errors: errors });
                } else {
                    
                    // data is valid and sanitized. save it
                    newRole.save(function (err) {
                        if (err) { return next (err);}
                        res.redirect('/roles/'+req.params.orgId);
                    });
                }
            });
        });
    }
];

// Display role modify form on GET.
exports.role_modify_get = function(req, res, next) {
    async.parallel(
        {
            role: function(callback) {
                Role.findById(req.params.id).populate('organization').exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            res.render('role_form', { 
                title: "Modify role '" + results.role.name + "' for organization '" + results.role.organization.name + "'", 
                role: results.role,
                org: results.role.organization
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
        var errors = validationResult(req).array();

        // reload the role record to retrieve the organization
        Role.findById(req.params.id).populate('organization').exec(function(err, role) {
            if (err) { return next(err); }
            // check if there is another role with this name is the organization
            Role.findOne({'name': req.body.name, 'organization': role.organization})
                .exec (function (err, anotherRole){
                if (err) {return next(err);}
                if (anotherRole && anotherRole.id != role.id) {
                    errors.push ({msg:'Another role with this name exists in the organization'});
                }

                // create a new role record
                var newRole = new Role (
                    { name: req.body.name,
                    description: req.body.description,
                    organization: role.organization.id,
                    _id:req.params.id
                    });
            
                if (errors.length != 0) {
                    res.render('role_form', {
                        title: "Modify role '" + role.name + "' for organization '" + role.organization.name + "'", 
                        role: newRole,
                        org: role.organization,
                        errors: errors });
                } else {

                    // data is valid. update the record
                    Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
                        if (err) { return next(err); }
                        res.redirect ('/roles/'+newRole.organization._id);

                    });
                }
            });
        });
    }
]

// Display role delete form on GET.
// TODO prevent deletion when role has related jobs or tasks
exports.role_delete_get = function(req, res, next) {

    async.parallel({
        role: function(callback) {
            Role.findById(req.params.id).populate('organization').exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render.
        res.render('role_delete', { 
            title: "Delete role '" + results.role.name + "'" + " from organization '" + results.role.organization.name + "'",
            role: results.role,
            org: req.body.org } );
    });

};

// Handle role delete on POST.
exports.role_delete_post = function(req, res, next) {

    async.parallel({
        role: function(callback) {
          Role.findById(req.params.id).exec(callback)
        },
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

// the list of training requirments for role
exports.role_training_list = function (req, res, next) {
    async.parallel ({
        // get the role that contains the training list
        role: function (callback) {
            Role.findById(req.params.id).populate('trainings').exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); } 
        roleName = results.role.name;

        // display the training requirements list
        res.render(
            '../role/views/role_training_list', 
            { title: "Training requirements for role '"+ roleName + "'",
             role: results.role, 
             trainings: results.role.trainings });

    });

};

// Display role's training requirements create form on GET.
exports.role_training_create_get = function(req, res, next) {

    // get the role and all of the possble trainings could apply to that role
    async.parallel ( {
        role: function (callback) {
            Role.findById(req.params.id).exec(callback);},
        trainings: function (callback) {
            Training.find ({}).exec(callback);},

    },function (err, results) {
        if (err) { return next(err);}

        res.render('role_training_form', 
            { title: "Add a training requirement for role '" + results.role.name + "'",
            role: results.role, 
            trainings: results.trainings, 
            modify: false   });

    }); 
};

//TODO avoid dujplicates on add and modify role/training
// add a training requirement to a role POST
exports.role_training_create_post = function (req, res, next) {

    // load the current role record so it's training array can be updated
    Role.findById(req.params.id).exec(function(err, role) {
        if (err) { return next(err); }
        if (role==null) {
            var err = new Error('Role not found');
            err.status = 404;
            return next(err);
        }

        // add the new training requirement to the existing training list
        role.trainings.push(req.body.training);
 
        // create a new role record from the validiated and sanitized data.
        var newRole = new Role ( {
            trainings: role.trainings,
            organization: role.organization,
            name: role.name,
            description: role.description,
            _id: req.params.id
        });
        
        // update the record and return to role training list
        Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
            if (err) { return next(err); }
            res.redirect ('/roles/role/'+req.params.id+'/training');

        });
    });
}

// Display person's leave modify form on GET.
exports.role_training_modify_get = function(req, res, next) {
    async.parallel({
        role: function(callback) {
            Role.findById(req.params.id).populate('trainings').exec(callback);
        },
        trainings: function(callback) {
            Training.find({}).exec(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            res.render('role_training_form', { 
                title: "Modify training requirements for role '" + results.role.name + "'", 
                role: results.role, 
                trainings: results.trainings, 
                trainingid: req.params.trainingid,
                modify: true   });
        }
    );

}
// Display role training requirement modify form on POST.
exports.role_training_modify_post = function (req, res, next) {

    // load the current role record so it's training array can be updated
    Role.findById(req.params.id).populate('trainings').exec(function(err, role) {
        if (err) { return next(err); }

        // create a new role record from the validiated and sanitized data.
        var newRole = new Role ( {
            trainings: role.trainings,
            organization: role.organization,
            name: role.name,
            description: role.description,
            _id: req.params.id
        });

        // replace the current training requirement with the new one
        for (i in role.trainings) {
            if (newRole.trainings[i].id == req.params.trainingid) {
                newRole.trainings[i] = req.body.training;
                break;
            }
        }

        // update the record and return to role training list
        Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
            if (err) { return next(err); }
            res.redirect ('/roles/role/'+req.params.id+'/training');

        });
                   
    });
}

exports.role_training_delete_get = function(req, res, next) {

    async.parallel({
        role: function(callback) {
            Role.findById(req.params.id).exec(callback)
        },
        training: function(callback) {
            Training.findById(req.params.trainingid).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render.
        res.render('role_training_delete', { 
            title: "Delete training '" + results.training.name + "' from role '" + results.role.name +"'", 
            role: results.role,
            training: results.training } );
    });

};

// Handle role delete on POST.
exports.role_training_delete_post = function(req, res, next) {

    async.parallel({
        role: function(callback) {
          Role.findById(req.params.id).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }

         // create a new role record so the selected training requirement can be deleted from the array
         var newRole = new Role ( {
            trainings: results.role.trainings,
            organization: results.role.organization,
            name: results.role.name,
            description: results.role.description,
            _id: req.params.id
        });

        // remove the current training requirement with the new role record
        for (i in newRole.trainings) {
            if (newRole.trainings[i] == req.params.trainingid) {
                newRole.trainings.splice(i, 1);
                break;
            }
        }
        
        // update the record and return to role training list
        Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
            if (err) { return next(err); }
            res.redirect ('/roles/role/'+req.params.id+'/training');

        });
    });
};

