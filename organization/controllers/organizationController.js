var Organization = require('../../models/organization');
var Job = require('../../models/job');
var Role = require('../../models/role');
var Person = require('../../models/person');
const { body, validationResult } = require('express-validator');
var async = require('async');

exports.organization_list = function (req, res, next) {
    Organization.find({}, 'name description')
        .sort({name: 1})
        .exec(function (err, orgs) {
            if (err) { return next(err); }
            res.render(
                '../views/organization_list', 
                { title: 'Organization List', orgs: orgs });
        }
    );
};

// Display organization create form on GET.
exports.organization_create_get = function(req, res, next) {
    res.render('organization_form', { title: 'Create Organization'});

};
// Handle organization create form on POST
exports.organization_create_post = [

    // validate and sanitize fields
    body('name', 'Name cannot be blank').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),

    // save the new organization unless it's a duplicate
    (req, res, next) => {
        var errors = validationResult(req).array();
        Organization.findOne({'name': req.body.name}).then(org => {
            if (org) {
                errors.push({msg: 'Organization with that name already exists.'});
            }
        
            // create an organization object with escaped and trimmed data
            var newOrg = new Organization (
                { name: req.body.name,
                description: req.body.description});

            // repost if any errors
            if (errors.length != 0) {
                res.render('organization_form', {
                    title: 'Create Organization', 
                    organization: newOrg,
                    errors:  errors });
            } else {

                // an organization with a new name. save it
                newOrg.save(function (err) {
                if (err) { return next (err);}
                res.redirect('/organizations');
                });
            }
        });
    }
];

// Display organization modify form on GET.
exports.organization_modify_get = function(req, res, next) {
    Organization.findById(req.params.id).exec (function (err, org) {
        if (err) { return next(err); }
        res.render('organization_form', { 
            title: "Modify Organization '" + org.name + "'", 
            organization: org});    

    });
};

exports.organization_modify_post = [

    // validate and sanitze fields.
    body('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),

    // update the record unless it is a duplicate
    (req, res, next) => {

        var errors = validationResult(req).array();

        // if the name was changed make sure it is unique
        Organization.find({'name': req.body.name}).exec (function (err, orgs) {
            if (orgs.length == 1 && orgs[0].id != req.params.id) {

                // there is a record that has the same name
                errors.push({ msg: 'Organization with that name already exists.'});
            }
        
            // create an organization object with escaped and trimmed data
            var newOrg = new Organization (
                { name: req.body.name,
                description: req.body.description,
                _id: req.params.id
            });
            
            // display errors
            if (errors.length != 0) {
                res.render('organization_form', {
                    title: 'Create Organization', 
                    organization: newOrg,
                    errors: errors });

            } else {
                Organization.findByIdAndUpdate(req.params.id, newOrg, {}, function (err) {
                    if (err) { return next(err); }
                    res.redirect ('/organizations');
                });

            }
        });
    }
]

// Display organization delete form on GET.
exports.organization_delete_get = function(req, res, next) {

    Organization.findById(req.params.id).exec (function (err, org) {
        if (err) { return next(err); }
        res.render('organization_delete', { 
            title: "Delete organization '"+org.name+"'",
            organization: org } );
    });

};

// Handle organization delete on POST.
exports.organization_delete_post = function(req, res, next) {

    // check if there are any children of the organization.
    // If so, report the number and prevent delete
    async.parallel({
        job_count: function(callback) {
            Job.countDocuments({'organization': req.params.id}, callback);
        },
        
        person_count: function(callback) {
            Person.countDocuments({'organization': req.params.id}, callback);
        },
        
        role_count: function(callback) {
            Role.countDocuments({'organization': req.params.id}, callback);
        },
        
    }, function (err, results){
        var errors = validationResult(req).array();
        if (results.job_count != 0) {
            errors.push({msg: results.job_count + ' Jobs must be deleted before the organization can be deleted.'});
        }
        if (results.person_count != 0) {
            errors.push({msg: results.person_count + ' Personnel must be removed before the organization can be deleted.'});
        }
        if (results.role_count != 0) {
            errors.push({msg: results.role_count + ' Roles must be deleted before the organization can be deleted.'});
        }

        Organization.findById(req.params.id).exec (function (err, org) {
            if (err) { return next(err); }

            // redisplay the delete post page with errors
            if (errors.length !=0) {
                res.render('organization_delete', { 
                    title: "Delete organization '"+org.name+"'",
                    organization: org,
                    errors:errors } );
            } else {

                // otherwise delete the record
                Organization.findByIdAndRemove(req.params.id, function (err) {
                    if (err) { return next(err); }
                    res.redirect('/organizations')
                });
            }
            
        });
    });
}


