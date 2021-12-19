var Organization = require('../../models/organization');
var Person = require('../../models/person');
// var Leave = require('../../models/leave');
const { body, validationResult } = require('express-validator');
var async = require('async');

exports.organization_person_list = function (req, res, next) {
    async.parallel ({
        // get the organization object for this group of persons
        organization: function (callback) {
            Organization.findById(req.params.orgid).exec(callback);},
        // get the persons for this organization
        persons: function (callback) {
            Person.find({ 'organization': req.params.orgid })
            .populate('organization')
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        orgName = results.organization.name;
        res.render(
            '../person/views/person_list', 
            { title: "Person List for Organization '"+ orgName + "'",
             organization: results.organization, 
             persons: results.persons });

    });

};

// Display person create form on GET.
exports.person_create_get = function(req, res, next) {
    var org = Organization.findById(req.params.orgId)
        .exec(function (err, org) {
        if (err) { return next(err);}
        res.render('person_form', { title: 'Create Person for Organzation "' + org.name + '"'});

    });
};

// Handle person create form on POST
exports.person_create_post = [

    // validate and sanitize fields
    body('lastName', 'Last Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('firstName', 'First Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('email', 'Email is not valid.').trim().isEmail().escape(),
    // prevent a new person from having the same name as a current one

    // save the new person
    (req, res, next) => {

        // get the organization that this person is to belong to
        Organization.findById(req.params.orgId).exec(function(err, org) {
            if (err) { return next(err);}
            req.body.orgId = org._id;
            req.body.orgName = org.name;
            req.body.org = org;

            // create an person object with escaped and trimmed data
            var person = new Person (
                { lastName: req.body.lastName.trim(),
                    firstName: req.body.firstName.trim(),
                    email: req.body.email.trim(),
                    organization: req.body.org
                });

            // Extract the validation errors from a request.
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {

                res.render('person_form', {
                    title: "Create Person for Organization'" + req.body.orgName + "'", 
                    lastName:req.body.lastName,
                    firstName:req.body.firstName,
                    email:req.body.email,
                    organization:req.body.org,
                    modify: false,
                    errors: errors.array() });
            } else {
                
                // data is valid and sanitized. save it
                person.save(function (err) {
                    if (err) { return next (err);}
                    res.redirect('/persons/'+req.body.orgId);
                });
            }
        }
     );
}
];

// Display person modify form on GET.
// TODO allow the person to be moved from one organization to another
exports.person_modify_get = function(req, res, next) {
    async.parallel({
        person: function(callback) {
            Person.findById(req.params.id).populate('organization').exec(callback);
        },
        organizations: function(callback) {
                Organization.find(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            if (results.person==null) {
                var err = new Error('Person not found');
                err.status = 404;
                return next(err);
            }
            res.render('person_form', { 
                title: 'Modify Person', 
                person: results.person,
                organizations: results.organizations,
                modify:true});    
        }
    );

};

exports.person_modify_post = [
    // validate and sanitize fields.
    body('firstName', 'First name must not be empty.').trim().isLength({min: 1}).escape(),
    body('lastName', 'Last name must not be empty.').trim().isLength({min: 1}).escape(),
    body('email', 'Invalid Email adress').trim().isEmail().escape(),
    body('org', '').escape(),
    body('organizations', '').escape(),
    // TODO prevent a new person from having the same name as a current one

    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the person record to retrieve the organization
        Person.findById(req.params.id).exec(function(err, person) {
            if (err) { return next(err); }
            if (person==null) {
                var err = new Error('Person not found');
                err.status = 404;
                return next(err);
            }
            var personOrg = person.organization;
            console.log('selected organization: ' + req.body.org);
            var newPerson = new Person (
                { lastName: req.body.lastName.trim(),
                    firstName: req.body.firstName.trim(),
                    email: req.body.email.trim(),
                    organization: req.body.org,
                    _id: req.params.id
                });
        
            if (!errors.isEmpty()) {
                res.render('person_form', {
                    title: 'Modify Person', 
                    person: newPerson,
                    organizations: req.body.org,
                    modify: true,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                console.log('new Person\n');
                console.log(newPerson.lastName);
                console.log(newPerson.firstName);
                console.log(newPerson.email);
                console.log(newPerson.organization.toString());
                console.log(newPerson._id.toString());
                Person.findByIdAndUpdate(req.params.id, newPerson, {}, function (err) {
                    if (err) { return next(err); }

                    // redirect to the person's orignal organization
                    res.redirect ('/persons/'+personOrg);

                });
            }
        });
    }
];

// Display person delete form on GET.
// TODO prevent deletion when person has related tasks
exports.person_delete_get = function(req, res, next) {

    Person.findById(req.params.id)
    .exec(function(err, person) {
        if (err) { return next(err); }
        if (person==null) { // No results.
            res.redirect('/organizations');
        }
        // Successful, so render.
        res.render('person_delete', { title: 'Delete person (without children bodying)', person: person } );
    });

};

// Handle person delete on POST.
exports.person_delete_post = function(req, res, next) {

    Person.findById(req.params.id)
    .exec(function(err, person) {
        if (err) { return next(err); }
            // person has no children. Delete object and redirect to the list of persons for its organization.
            Person.findByIdAndRemove(person.id, function deleteperson(err) {
                if (err) { return next(err); }
                // Success - go to organization list
                res.redirect ('/persons/'+person.organization);
            })
        // }
    });
};

