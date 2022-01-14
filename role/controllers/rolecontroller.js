var Organization = require('../../models/organization');
var Role = require('../../models/role');
var Job = require('../../models/job');
const Training = require('../../models/training');
const { check, validationResult } = require('express-validator');
var async = require('async');
const { training_list } = require('../../training/controllers/trainingController');

// the list of roles for an organization
exports.organization_role_list = async function (req, res, next) {

    // get the organization
    let org = null;
    try {
        org = await Organization.findById(req.params.orgId);
    } catch (err) {
        if (err) { return next(err); }

    }

    // get all of the roles for the organization
    let roles = null;
    try {
        roles = await Role.find({'organization': req.params.orgId});
    } catch (err) {
        if (err) { return next(err); }

    }

    // get the job for this organization
    let jobs = null;
    try {
        jobs = await Job.find({'organization': req.params.orgId});
    } catch (err) {
        if (err) { return next(err); }

    }

    // grab the role data to appear on the page
    var roleData = []
    for (let i = 0 ; i < roles.length; i++) {
        let role = roles[i];
        roleData.push ({
            name: role.name,
            description: role.description,
            id: role.id,
            nJobs: 0
        });
        for (let j = 0; j < jobs.length; j++) {
            // check through the jobs array on this role
            let job = jobs[j];
            for (let k = 0; k < job.role.length; k++) {

                if (job.role[k].toString() == role.id.toString()) {
                    roleData[i].nJobs++;
                    break;
                }
            }
        }
    }
    res.render(
        '../role/views/role_list', 
        { title: "Role List for Organization '"+ org.name + "'",
        organization: org,
        role_list: roleData });

}

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
    async (req, res, next) => {
        var errors = validationResult(req).array();

        // get the organization that this role is to belong to
        let org = null;
        try {
            org = await Organization.findById(req.params.orgId);
        } catch (err) {
            if (err) { return next(err);}
        }



        // check for duplicate role in this organization
        let role = null;
        try {
            role = await Role.findOne({'name': req.body.name, 'organization': req.params.orgId});
        } catch (err) {
            if (err) { return next(err)};
        }
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
    }
];

// Display role modify form on GET.
exports.role_modify_get = async function(req, res, next) {
  
    let role = null;
    try {
        role = await Role.findById(req.params.id).populate('organization');        
    } catch (err) {
        if (err) { return next(err); }
    }
    res.render('role_form', { 
        title: "Modify role '" + role.name + "' for organization '" + role.organization.name + "'", 
        role: role,
        org: role.organization
        });    
}

exports.role_modify_post = [
    // validate and sanitze fields.
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),

    // process request after validation and sanittzation
    async (req, res, next) => {
        var errors = validationResult(req).array();

        let role = null;
        try {
            role = await Role.findById(req.params.id).populate('organization');    
        } catch (error) {
            if (error) return(next(error));
        }

        // check if there is another role with this name is the organization
        let anotherRole = null;
        try {
            anotherRole = await Role.findOne({'name': req.body.name, 'organization': role.organization});
        } catch (error) {
            if (error) return(next(error));
        }
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
    }
]

// Handle role delete on GET.
exports.role_delete_get = function(req, res, next) {
    Role.findById(req.params.id).exec(function (err, role) {
        if (err) { return next(err); }
        Role.findByIdAndRemove(req.params.id, function (err) {
            if (err) { return next(err); }
            res.redirect ('/roles/'+role.organization);
        });
    });
}
