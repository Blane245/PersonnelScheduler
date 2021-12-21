var Organization = require('../../models/organization');
var Person = require('../../models/person');
var Leave = require('../../models/leave');
var Training = require('../../models/training');
var Person_Training = require('../../models/person_training');
const { body, validationResult } = require('express-validator');
var async = require('async');
const { find } = require('../../models/organization');
const person = require('../../models/person');

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
    Organization.findById(req.params.orgId)
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
        personName = results.person.fullName;
        res.render(
            '../person/views/leave_list', 
            { title: "Leave List for '"+ personName + "'",
             person: results.person, 
             leaves: results.leaves });

    });

};

// Display person's leave create form on GET.
exports.person_leave_create_get = function(req, res, next) {
    Person.findById(req.params.id)
    .exec(function (err, person) {
        if (err) { return next(err);}
        res.render('leave_form', { title: 'Create Leave for Person "' + person.fullName + '"'});

    });
};

// add or modify a leave for a person
exports.person_leave_create_post = [
    
    // validate and sanitize fields
    body('name', 'Leave name must be given.').trim().isLength({min: 1}).escape(),
    body('startDate', 'Start Date must be a valid.').toDate(),
    body('endDate', 
        'End Date must be a valid date. If provided, it muust be greater than or equal to the Start Date.')
        .optional({nullable: true, checkFalsy: true}).bail()
        .custom((value, {req}) => value < req.body.startDate)
        .toDate(),
    body('duration', '').escape(),

    // save the new leave
    (req, res, next) => {

        // Extract the validation errors from the request
        const errors = validationResult (req);

        // create a new leave record from the vlaidiated and sanitixed data.
        var leave = new Leave ( {
            name: req.body.name,
            startDate : req.body.startDate,
            endDate: req.body.endDate,
            duration: req.body.duration,
            person: req.params.id
        });

        // redisplay the form is there are errors
        if (!errors.isEmpty()) {
            Person.findById(req.param.id)
            .exec (function (err, person) {
                if (err) { return next (err); }
                res.render('leave_form'), { 
                    title: 'Create Leave for Person "' + person.name + '"',
                    leave: newLeave,
                    errors: errors.array()}
                });
        } else {
            
            // data is valid and sanitized. save it and return to leave list
            leave.save(function (err) {
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
            Leave.findById(req.params.id).populate('person').exec(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            if (results.leave==null) {
                var err = new Error('Leave not found');
                err.status = 404;
                return next(err);
            }
            res.render('leave_form', { 
                title: "Modify Leave for '" + results.leave.person.fullName + "'", 
                leave: results.leave,
            });    
        }
    );

}
// TODO startDate is decrementing on each redisplay and endDate validation is not working
// also validation errors are not clearing 
// Display person's leave modify form on POST.
exports.person_leave_modify_post = [
    // validate and sanitize fields.
    body('name', 'Leave name must not be empty.').trim().isLength({min: 1}).escape(),
    body('startDate', 'Start Date must be a valid.').toDate(),
    body('endDate', 
        'End Date must be a valid date. If provided, it must be greater than or equal to the Start Date.')
        .optional({nullable: true, checkFalsy: true}).bail()
        .custom((value, {req}) => value < req.body.startDate)
        .toDate(),
    body('duration', '').escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the person record to retrieve the organization
        Leave.findById(req.params.id).populate('person').exec(function(err, leave) {
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
                    _id: req.params.id
                });
        
            if (!errors.isEmpty()) {
                res.render('leave_form', {
                    title: "Modify leave for Person '" + leave.person.fullName ,
                    leave: newLeave,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Leave.findByIdAndUpdate(req.params.id, newLeave, {}, function (err) {
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
    Leave.findById(req.params.id).populate('person')
    .exec(function(err, leave) {
        if (err) { return next(err); }
        if (leave==null) { // No results.
            res.redirect('/index/');
        }
        // Successful, so render.
        res.render('leave_delete', 
            { title: "Delete leave for Person '" + leave.person.fullName + "'", 
            leave: leave } );
    });

}

// Display person's leave delete form on POST.
exports.person_leave_delete_post = function(req, res, next) {
    Leave.findById(req.params.id).populate('person')
    .exec(function(err, leave) {
        if (err) { return next(err); }
            Leave.findByIdAndRemove(leave.id, function (err) {
                if (err) { return next(err); }
                // Success - go to organization list
                res.redirect ('/persons/person/'+leave.person.id+'/leave');
            })
        // }
    });

}

// display a person's training records
exports.person_training_list = function(req, res, next) {

    // get the person and all of the person's person_training


    // render the person_training list for a person
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
    body('expirationDate', 'Training expiration date must be a valid.').optional({ checkFalsy: true }).isISO8601().toDate(),

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
            Person_Training.findById(req.params.id).populate('training').populate('person').exec(callback);
        },
        trainings: function (callback) {
            Training.find({}).exec(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            if (results.person_training==null) {
                var err = new Error('Training record not found');
                err.status = 404;
                return next(err);
            }
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
// TODO expirationDate is decrementing on each redisplay
// also validation errors are not clearing 
// Display person's training record modify form on POST.
exports.person_training_modify_post = [
    // validate and sanitize fields.
    body('training', '').escape(),
    body('expirationDate', 'Training expiration date must be a valid.').optional({ checkFalsy: true }).isISO8601().toDate(),
 
    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the person training record
        Person_Training.findById(req.params.id).populate('person').exec(function(err, person_training) {
            if (err) { return next(err); }
            if (person_training==null) {
                var err = new Error('Person-Training not found');
                err.status = 404;
                return next(err);
            }
            var newPersonTraining = new Person_Training (
                { person: person_training.person,
                  expirationDate: req.body.expirationDate,
                  training: req.body.training,
                  _id: req.params.id
                });
        
            if (!errors.isEmpty()) {
                res.render('person_training_form', {
                    title: "Modify training record for '" + person_training.person.fullName ,
                    person_training: newPersonTraining,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Person_Training.findByIdAndUpdate(req.params.id, newPersonTraining, {}, function (err) {
                    if (err) { return next(err); }

                    // redirect to the person's training list
                    res.redirect ('/persons/person/'+person_training.person.id+'/person_training');

                });
            }
        });
    }

]

// // Display person's leave delete form on GET.
// exports.person_leave_delete_get = function(req, res, next) {
//     Leave.findById(req.params.id).populate('person')
//     .exec(function(err, leave) {
//         if (err) { return next(err); }
//         if (leave==null) { // No results.
//             res.redirect('/index/');
//         }
//         // Successful, so render.
//         res.render('leave_delete', 
//             { title: "Delete leave for Person '" + leave.person.fullName + "'", 
//             leave: leave } );
//     });

// }

// // Display person's leave delete form on POST.
// exports.person_leave_delete_post = function(req, res, next) {
//     Leave.findById(req.params.id).populate('person')
//     .exec(function(err, leave) {
//         if (err) { return next(err); }
//             Leave.findByIdAndRemove(leave.id, function (err) {
//                 if (err) { return next(err); }
//                 // Success - go to organization list
//                 res.redirect ('/persons/person/'+leave.person.id+'/leave');
//             })
//         // }
//     });

// }