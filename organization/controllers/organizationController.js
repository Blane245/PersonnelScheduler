var Organization = require('../../models/organization');
const { check, validationResult } = require('express-validator');
var async = require('async');
const organization = require('../../models/organization');

exports.organization_list = function (req, res, next) {
    Organization.find({}, 'name description')
        .sort({name: 1})
        .exec(function (err, list_organizations) {
            if (err) { return next(err); }
            res.render(
                '../views/organization_list', 
                { title: 'Organization List', organization_list: list_organizations });
        } , function(err, results) {
            console.log(err);
            res.render('../views/organization_list', { title: 'Organization List', error: err, data: results }
            );
        });
};

// Display organization create form on GET.
exports.organization_create_get = function(req, res, next) {
    res.render('organization_form', { title: 'Create Organization'});

};
// Handle organization create form on POST
exports.organization_create_post = [

   
    // validate and sanitize fields
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),

    // save the new organization
    (req, res, next) => {
        const errors = validationResult(req);

        // creat an organization object with escaped and trimmed data
        var org = new Organization (
            { name: req.body.name.trim(),
              description: req.body.description.trim()});
        
        if (!errors.isEmpty()) {
            console.log('error while saving:' + req.body.name);

            res.render('organization_form', {
                title: 'Create Organization', 
                name:req.body.name.trim(), 
                description:req.body.description.trim(),
                errors: errors.array() });
        } else {
            
            // data is valid and sanitized. save it
            console.log('saving reccord');
            org.save(function (err) {
                if (err) { return next (err);}
                res.redirect('/organizations');
            });
        }
    }
];

// Display organization modify form on GET.
exports.organization_modify_get = function(req, res, next) {
    async.parallel(
        {
            organization: function(callback) {
                console.log('looking for organization: ' + req.params.id);
                Organization.findById(req.params.id).exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            if (results.organization==null) {
                var err = new Error('Organization not found');
                err.status = 404;
                return next(err);
            }
            res.render('organization_form', { 
                title: 'Modify Organization', 
                organization: results.organization});    
        }
    );

};

exports.organization_modify_post = [
    // validate and sanitze fields.
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);
        var org = new Organization (
            { name: req.body.name.trim(),
              description: req.body.description.trim(),
              _id:req.params.id
            });
        
        if (!errors.isEmpty()) {
            res.render('organization_form', {
                title: 'Modify Organization', 
                name:req.body.name.trim(), 
                description:req.body.description.trim(),
                errors: errors.array() });
        } else {
            // data is valid. update the record
            Organization.findByIdAndUpdate(req.params.id, org, {}, function (err) {
                if (err) { return next(err); }
                res.redirect ('/organizations');

            });
        }
        
 

    }


]

// Display organization delete form on GET.
exports.organization_delete_get = function(req, res, next) {

    async.parallel({
        organization: function(callback) {
            Organization.findById(req.params.id).exec(callback)
        },
        // organizations_books: function(callback) {
        //   Book.find({ 'organization': req.params.id }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.organization==null) { // No results.
            res.redirect('/catalog/organizations');
        }
        // Successful, so render.
        res.render('organization_delete', { 
            title: "Delete organization '"+results.organization.name+"'",
            organization: results.organization } );
    });

};

// Handle organization delete on POST.
exports.organization_delete_post = function(req, res, next) {

    async.parallel({
        organization: function(callback) {
          Organization.findById(req.body.organizationid).exec(callback)
        },
        // organizations_books: function(callback) {
        //   Book.find({ 'organization': req.body.organizationid }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        // if (results.organizations_books.length > 0) {
        //     // organization has books. Render in same way as for GET route.
        //     res.render('organization_delete', { title: 'Delete organization (delete children first)', organization: results.organization, organization_books: results.organizations_books } );
        //     return;
        // }
        // else {
            // organization has no children. Delete object and redirect to the list of organizations.
            Organization.findByIdAndRemove(req.body.organizationid, function deleteorganization(err) {
                if (err) { return next(err); }
                // Success - go to organization list
                res.redirect('/organizations')
            })
        // }
    });
};

