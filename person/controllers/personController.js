var Organization = require('../../models/organization');
var Person = require('../../models/person');
var Leave = require('../../models/leave');
var Task = require('../../models/task');
var Training = require('../../models/training');
var Person_Training = require('../../models/person_training');
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
            .exec(callback);
        },
        tasks: function (callback) {
            Task.find({}).exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        orgName = results.organization.name;
        personData = [];
        for (let i = 0; i < results.persons.length; i++) {
            personData.push ({
               fullName: results.persons[i].fullName,
               email: results.persons[i].email,
               id: results.persons[i].id,
               nTasks: 0 
            });
            for (let j = 0; j < results.tasks.length; j++) {
                for (let k = 0; k < results.tasks[j].persons.length; k++) {
                    if (results.tasks[j].persons[k].toString() == results.persons[i].id.toString()) {
                        personData[i].nTasks++;
                        break;
                    }
                }
            }
        }
        res.render(
            '../person/views/person_list',{ 
                title: "Person List for Organization '"+ orgName + "'",
                organization: results.organization,
                persons: personData 
        });
    });
};

// Display person create form on GET.
exports.person_create_get = function(req, res, next) {
    Organization.findById(req.params.orgId)
        .exec(function (err, org) {
        if (err) { return next(err);}
        res.render('person_form', { 
            title: 'Create Person for Organization "' + org.name + '"', org: org.id
            });

    });
};

// Handle person create form on POST    
exports.person_create_post = [

    // validate and sanitize fields
    body('lastName', 'Last Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('firstName', 'First Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('email', 'Email is not valid.').trim().isEmail().escape(),

    // save the new person unless the email is not unique
    async (req, res, next) => {
        var errors = validationResult(req).array();

        let person = null;
        try {
            person = await Person.findOne({'email': req.body.email}).populate('organization');
        } catch (err) {
            return next(err);
        }

        if(person) {
            errors.push({msg: 'Person with that email already exists.'});
        }

        // create a new Person object
        var newPerson = new Person ({ 
            lastName: req.body.lastName,
            firstName: req.body.firstName,
            email: req.body.email,
            organization: req.params.orgId
        });

        // repost if any errors
        if (errors.length != 0) {
            res.render('person_form', {
                title: "Create Person for Organization'" + person.organization.name + "'", 
                person: newPerson,
                modify: false,
                org: req.params.orgId,
                errors: errors });

        } else {

            // a person with a new email address is saved
            newPerson.save(function (err) {
                if (err) { return next (err);}
                res.redirect('/persons/'+req.params.orgId);
            });
        }
    }
]

// Display person modify form on GET.
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
            res.render('person_form', { 
                title: "Modify person '"+results.person.fullName+"' for organization '"+results.person.organization.name+"'",
                person: results.person,
                organizations: results.organizations,
                org: results.person.organization.id,
                modify:true});    
        }
    );

};

exports.person_modify_post = [
    // validate and sanitize fields.
    body('firstName', 'First name must not be empty.').trim().isLength({min: 1}).escape(),
    body('lastName', 'Last name must not be empty.').trim().isLength({min: 1}).escape(),
    body('email', 'Email address is not valid').trim().isEmail().escape(),

    // process request after validation and sanitization
    async (req, res, next) => {

        var errors = validationResult(req).array();

        // check for another person with the same amail address
        let persons = null;
        try {
             persons = await Person.find({'email': req.body.email});

        } catch (err) {
            if (err) { return next(err); }
        }
        if (persons.length == 1 && persons[0].id != req.params.id) {
            errors.push({msg: 'Person with that same email address already exists.'});
        }

        // create a new person record from the request body
        var newPerson = new Person ({ 
            lastName: req.body.lastName,
            firstName: req.body.firstName,
            email: req.body.email,
            organization: req.body.org,
            _id: req.params.id
        });

        // display errors, if any, after reloading the organizations array
        if (errors.length != 0) {
            let orgs = null;
            try {
                orgs = await Organization.find({});
            } catch (err) {
                return next(err);
            }
            res.render('person_form', {
                title: 'Modify Person', 
                person: newPerson,
                organizations: orgs,
                modify: true,
                org: req.body.org,
                errors: errors});
        } else {

            // data is valid. update the record after getting the orginal organization
            let person = null;
            try {
                person = await Person.findByIdAndUpdate(req.params.id, newPerson, {});
            } catch (err) {
                if (err) { return next(err); }
            }
            Person.findByIdAndUpdate(req.params.id, newPerson, {}, function (err) {
                if (err) { return next(err); }
                // redirect to the person's orignal organization
                res.redirect ('/persons/'+person.organization);

            });
        }
    }
];

// Handle person delete on GET.
exports.person_delete_get = function(req, res, next) {


    // get all of the peron's leave and training records so they can ge deleted as well
    async.parallel({
        person: function (callback) {
            Person.findById(req.params.id).exec(callback);},
        leaves: function (callback) {
            Leave.find({'person': req.params.id}).exec(callback);},
        person_trainings: function (callback) {
            Person_Training.find({'person':req.params.id}).exec(callback);}

    }, function(err, results) {
        if(err) {return (next(err));}
    
        // Delete person and all assocated leave and person_training records. redirect to the list of persons for its organization.
        for (let i = 0; i < results.leaves.length; i++) {
            Leave.findByIdAndRemove(results.leaves[i].id, function (err) {
                if (err) { return next(err);}
            });
        }
        for (let i = 0; i < results.person_trainings.length; i++) {
            Person_Training.findByIdAndRemove(results.person_trainings[i], function (err) {
                if (err) { return next(err);}
            });
        }
        Person.findByIdAndRemove(req.params.id, function (err) {
            if (err) { return next(err); }
            // Success - go to organization list
            res.redirect ('/persons/'+results.person.organization);
        });
    });
};
