var Organization = require('../../models/organization');
var Job = require('../../models/job');
var Role = require('../../models/role');
var Person = require('../../models/person');
const { body, validationResult } = require('express-validator');
var async = require('async');

exports.organization_list = function (req, res, next) {

    // get all of the organizations and children records
     async.parallel({
        orgs: function(callback) {
            Organization.find({}, callback).sort({name: 1});
        },
        
        jobs: function(callback) {
            Job.find({}, callback);
        },
        
        persons: function(callback) {
            Person.find({}, callback);
        },
        
        roles: function(callback) {
            Role.find({}, callback);
        },
            
    }, function (err, results){

        // build up the counts of the children records for each org
        var orgData = [];
        for (let i = 0; i < results.orgs.length; i++) {
            orgData.push ({
                name: results.orgs[i].name, 
                description: results.orgs[i].description,
                id: results.orgs[i].id, 
                nRoles: 0,
                nJobs: 0,
                nPersons: 0});
            for (let j = 0; j < results.roles.length; j++) {
                if (results.roles[j].organization.toString() == results.orgs[i].id.toString()) {
                    orgData[i].nRoles++;
                }
            }
            for (let j = 0; j < results.jobs.length; j++) {
                if (results.jobs[j].organization.toString() == results.orgs[i].id.toString()) {
                    orgData[i].nJobs++;
                }
            }
            for (let j = 0; j < results.roles.length; j++) {
                if (results.persons[i].organization.toString() == results.orgs[i].id.toString()) {
                    orgData[i].nPersons++;
                }
            }
        }
        res.render(
            '../views/organization_list', 
            { title: 'Organization List', orgs: orgData });
    });
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

// Handle organization delete on POST.
exports.organization_delete_get = function(req, res, next) {

    Organization.findByIdAndRemove(req.params.id, function (err) {
        if (err) { return next(err); }
        res.redirect('/organizations')
    });
        
}


