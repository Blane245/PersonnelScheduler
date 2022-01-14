
var Person = require('../../models/person');
var Leave = require('../../models/leave');
const { body, validationResult } = require('express-validator');
var async = require('async');

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
    async (req, res, next) => {

        // Extract the validation errors from the request
        var errors = validationResult (req).array();

        // check if this new leave overlaps any existing leave
        let leaves;
        try {
            leaves = await Leave.find({'person': req.params.id});
        } catch (err) {
            return next(err);
        }

        for (let i = 0; i < leaves.length; i++) {
            const leave = leaves[i];
            if ((leave.startDate_formatted < req.body.startDate && leave.endDate_formatted >= req.body.startDate) ||
                (leave.startDate_formatted >= req.body.startDate && req.body.endDate == '') ||
                (leave.startDate_formatted >= req.body.startDate && leave.startDate_formatted == '') ||
                (leave.startDate_formatted >= req.body.startDate && leave.startDate_formatted <= req.body.endDate)) {
                errors.push({msg: 'This leave overlaps another leave for this person.'});
                break;
            }
        }

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
    async (req, res, next) => {

        var errors = validationResult(req).array();

        // check if this new leave overlaps any existing leave
        let leaves;
        try {
            leaves = await Leave.find({'person': req.params.id});
        } catch (err) {
            return next(err);
        }

        for (let i = 0; i < leaves.length; i++) {
            const leave = leaves[i];
            if (leave.id.toString() != req.params.leaveid.toString()) {
                if ((leave.startDate_formatted < req.body.startDate && leave.endDate_formatted >= req.body.startDate) ||
                    (leave.startDate_formatted >= req.body.startDate && req.body.endDate == '') ||
                    (leave.startDate_formatted >= req.body.startDate && leave.startDate_formatted == '') ||
                    (leave.startDate_formatted >= req.body.startDate && leave.startDate_formatted <= req.body.endDate)) {
                    errors.push({msg: 'This leave overlaps another leave for this person.'});
                    break;
                }
            }
        }

        // reload the person record to retrieve the organization
        let oldLeave;
        try {
            oldLeave = await Leave.findById(req.params.leaveid).populate('person');
        } catch (err) {
            return next(err);
        }

        if (oldLeave==null) {
            errors.push({msg: 'Leave not found.'});
        }

        var newLeave = new Leave (
            { name: req.body.name,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                person: oldLeave.person,
                _id: req.params.leaveid
            });
    
        if (errors.length != 0) {
            res.render('leave_form', {
                title: "Modify leave for Person '" + oldLeave.person.fullName ,
                leave: newLeave,
                person: newLeave.person,
                errors: errors });
        } else {
            // data is valid. update the record
            Leave.findByIdAndUpdate(req.params.leaveid, newLeave, {}, function (err) {
                if (err) { return next(err); }

                // redirect to the person's orignal organization
                res.redirect ('/persons/person/'+req.params.id+'/leave');

            });
        }
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

