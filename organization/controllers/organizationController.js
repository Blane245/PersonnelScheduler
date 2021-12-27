var Organization = require('../../models/organization');
const { body, validationResult } = require('express-validator');
var async = require('async');
const organization = require('../../models/organization');

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
    Organization.findByIdAndRemove(req.params.id, function (err) {
        if (err) { return next(err); }
        // Success - go to organization list
        res.redirect('/organizations')
    });
};

