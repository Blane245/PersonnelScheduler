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
    (req, res, next) => {
        var errors = validationResult(req).array();

        Person.findOne({'email': req.body.email}).populate('organization').exec (function (err, person){
            if(person) {
                errors.push({msg: 'Person with that email already exists.'});
            }

            // create a new Person object
            var newPerson = new Person (
                { lastName: req.body.lastName,
                    firstName: req.body.firstName,
                    email: req.body.email,
                    organization: req.params.orgId
            });

            // repost if any errors
            if (errors.length != 0) {
                Organization.findById(req.params.orgId).exec(function (err, org) {
                    if (err) {return next(err);}
                    res.render('person_form', {
                        title: "Create Person for Organization'" + org.name + "'", 
                        person: newPerson,
                        modify: false,
                        org: req.params.orgId,
                        errors: errors });
    
                });
            } else {

                // a person with a new email address is saved
                newPerson.save(function (err) {
                    if (err) { return next (err);}
                    res.redirect('/persons/'+req.params.orgId);
                });
            }
        });
    }
];

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
    (req, res, next) => {

        const errors = validationResult(req).array();

        // check for another person with the same amail address
        Person.find({'email': req.body.email}).exec (function (err, persons) {
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
                Organization.find().exec(function(err,orgs) {
                    res.render('person_form', {
                        title: 'Modify Person', 
                        person: newPerson,
                        organizations: orgs,
                        modify: true,
                        org: req.body.org,
                        errors: errors});
                });
            } else {
                // data is valid. update the record after getting the orginal organization
                Person.findById(req.params.id).exec(function(err, person) {
                    if (err) { return next(err); }
                    Person.findByIdAndUpdate(req.params.id, newPerson, {}, function (err) {
                        if (err) { return next(err); }
                        // redirect to the person's orignal organization
                        res.redirect ('/persons/'+person.organization);

                    });
                });
            }
        });
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
            res.redirect ('/persons/'+result.person.organization);
        });
    });
};

exports.person_leave_list = function(req, res, next) {

    // get the person and all of the person's leave


    // render the leave list for a person
    async.parallel ({
        // get the person object for this group of leaves
        person: function (callback) {
            Person.findById(req.params.id).exec(callback);},
        // get the leaves for this person
        leaves: function (callback) {
            Leave.find({ 'person': req.params.id })
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        res.render(
            '../person/views/leave_list', 
            { title: "Leave List for '"+ results.person.fullName + "'",
             person: results.person, 
             leaves: results.leaves });

    });

};

// Display person's leave create form on GET.
exports.person_leave_create_get = function(req, res, next) {
    Person.findById(req.params.id)
    .exec(function (err, person) {
        if (err) { return next(err);}
        res.render('leave_form', { title: 'Create Leave for Person "' + person.fullName + '"',
            person: person});

    });
};

// add or modify a leave for a person
exports.person_leave_create_post = [
    
    // validate and sanitize fields
    body('name', 'Leave name must be given.').trim().isLength({min: 1}).escape(),
    body('startDate', 'Start Date must be a valid.').isISO8601(),
    body('endDate', 'End Date must be a valid date.').optional({ checkFalsy: true }).isISO8601()
    .custom((value, { req }) => {
        if (value && value < req.body.startDate) {
            throw new Error('End Date must be greater than or equal to Start Date.');
        }
        return true;
    }),

    // save the new leave
    (req, res, next) => {

        // Extract the validation errors from the request
        var errors = validationResult (req).array();

        // create a new leave record from the vlaidiated and sanitixed data.
        var newLeave = new Leave ( {
            name: req.body.name,
            startDate : req.body.startDate,
            endDate: req.body.endDate,
            person: req.params.id
        });

        // redisplay the form is there are errors
        if (errors.length != 0) {
            Person.findById(req.params.id).exec(function (err, person) {
                if (err) { return next (err); }
                res.render('leave_form', { 
                    title: "Create Leave for Person '" + person.fullName + "'",
                    leave: newLeave,
                    person: person,
                    errors: errors
                });
            });
        } else {
            
            // data is valid and sanitized. save it and return to leave list
            newLeave.save(function (err) {
                if (err) { 
                    console.log('save error: \n'+err);
                    return next (err);}
                res.redirect('/persons/person/'+req.params.id+'/leave');
            });
        }
    }
];

// Display person's leave modify form on GET.
exports.person_leave_modify_get = function(req, res, next) {
    async.parallel({
        leave: function(callback) {
            Leave.findById(req.params.leaveid).populate('person').exec(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            res.render('leave_form', { 
                title: "Modify Leave for '" + results.leave.person.fullName + "'", 
                leave: results.leave,
                person: results.leave.person
            });    
        }
    );

}
// also validation errors are not clearing 
// Display person's leave modify form on POST.
exports.person_leave_modify_post = [
    // validate and sanitize fields.
    body('name', 'Leave name must not be empty.').trim().isLength({min: 1}).escape(),
    body('startDate', 'Start Date must be a valid.').isISO8601(),
    body('endDate', 'End Date must be a valid date.').optional({ checkFalsy: true, nullable: true }).isISO8601()
    .custom((value, { req }) => {
        if (value && value < req.body.startDate) {
            throw new Error('End Date must be greater than or equal to Start Date.');
        }
        return true;
    }), 
    body('duration', '').escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the person record to retrieve the organization
        Leave.findById(req.params.leaveid).populate('person').exec(function(err, leave) {
            if (err) { return next(err); }
            if (leave==null) {
                var err = new Error('Leave not found');
                err.status = 404;
                return next(err);
            }
            var newLeave = new Leave (
                { Name: req.body.Name,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    duration: req.body.duration,
                    person: leave.person,
                    _id: req.params.leaveid
                });
        
            if (!errors.isEmpty()) {
                res.render('leave_form', {
                    title: "Modify leave for Person '" + leave.person.fullName ,
                    leave: newLeave,
                    person: newLeave.person,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Leave.findByIdAndUpdate(req.params.leaveid, newLeave, {}, function (err) {
                    if (err) { return next(err); }

                    // redirect to the person's orignal organization
                    res.redirect ('/persons/person/'+leave.person.id+'/leave');

                });
            }
        });
    }

]

// Display person's leave delete form on GET.
exports.person_leave_delete_get = function(req, res, next) {
    Leave.findById(req.params.leaveid).populate('person')
    .exec(function(err, leave) {
        if (err) { return next(err); }
            Leave.findByIdAndRemove(leave.id, function (err) {
                if (err) { return next(err); }
                res.redirect ('/persons/person/'+leave.person.id+'/leave');
            })
        // }
    });

}

// display a person's training records
exports.person_training_list = function(req, res, next) {
    async.parallel ({
        // get the person object for this group of person_trainings
        person: function (callback) {
            Person.findById(req.params.id).exec(callback);},
        // get the person_trainings for this person
        person_trainings: function (callback) {
            Person_Training.find({ 'person': req.params.id }).populate('training')
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        personName = results.person.fullName;
        res.render(
            '../person/views/person_training_list', 
            { title: "Training List for '"+ personName + "'",
             person: results.person, 
             person_trainings: results.person_trainings });

    });

};

// Display person's person_training create form on GET.
exports.person_training_create_get = function(req, res, next) {

    // get the person and all of the possble trainings that a person can take
    async.parallel ( {
        person: function (callback) {
            Person.findById(req.params.id).exec(callback);},
        trainings: function (callback) { 
            Training.find({}).exec(callback);},

    },function (err, results) {
        if (err) { return next(err);}
        res.render('person_training_form', 
            { title: "Create training record for '" + results.person.fullName + "'",
            person: results.person, 
            trainings: results.trainings, 
            modify: false   });

    }); 
};

// add training reocrd for a person
exports.person_training_create_post = [
    
    // validate and sanitize fields
    body('training', '').escape(),
    body('expirationDate', 'Training expiration date must be a valid.').optional({ checkFalsy: true }).isISO8601(),

    // save the new person_training record
    (req, res, next) => {

        // Extract the validation errors from the request
        const errors = validationResult (req);

        // create a new person_training record from the vlaidiated and sanitixed data.
        var person_training = new Person_Training ( {
            training: req.body.training,
            expirationDate : req.body.expirationDate,
            person: req.params.id
        });

        // redisplay the form is there are errors
        if (!errors.isEmpty()) {
            Person.findById(req.param.id)
            .exec (function (err, person) {
                if (err) { return next (err); }
                res.render('person_training_form'), { 
                    title: 'Create training record for "' + person.name + '"',
                    person_training: person_training,
                    errors: errors.array()}
                });
        } else {
            
            // data is valid and sanitized. save it and return to person_training list
            person_training.save(function (err) {
                if (err) { 
                    console.log('save error: \n'+err);
                    return next (err);}
                res.redirect('/persons/person/'+req.params.id+'/person_training');
            });
        }
                    
    }


];

// Display person's training modify form on GET.
exports.person_training_modify_get = function(req, res, next) {
    async.parallel({
        person_training: function(callback) {
            Person_Training.findById(req.params.trainingid).populate('training').populate('person').exec(callback);
        },
        trainings: function (callback) {
            Training.find({}).exec(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            res.render('person_training_form', { 
                title: "Modify training record for '" + results.person_training.person.fullName + "'", 
                person: results.person_training.person,
                person_training: results.person_training,
                trainings: results.trainings,
                modify: true
            });    
        }
    );

}
// Display person's training record modify form on POST.
exports.person_training_modify_post = [
    // validate and sanitize fields.
    body('training', '').escape(),
    body('expirationDate', 'Training expiration date must be a valid.').optional({ checkFalsy: true }).isISO8601(),
 
    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the person training record
        Person_Training.findById(req.params.trainingid).populate('person').exec(function(err, person_training) {
            if (err) { return next(err); }
            var newPersonTraining = new Person_Training (
                { person: person_training.person,
                  expirationDate: req.body.expirationDate,
                  training: req.body.training,
                  _id: req.params.trainingid
                });
        
            if (!errors.isEmpty()) {
                res.render('person_training_form', {
                    title: "Modify training record for '" + person_training.person.fullName ,
                    person_training: newPersonTraining,
                    person: person_training.person,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Person_Training.findByIdAndUpdate(req.params.trainingid, newPersonTraining, {}, function (err) {
                    if (err) { return next(err); }

                    // redirect to the person's training list
                    res.redirect ('/persons/person/'+person_training.person.id+'/person_training');

                });
            }
        });
    }

]


// Display person's leave delete form on POST.
exports.person_training_delete_get = function(req, res, next) {
    Person_Training.findByIdAndRemove(req.params.trainingid, function (err) {
        if (err) { return next(err); }
        res.redirect ('/persons/person/'+req.params.id+'/person_training');
    });
}