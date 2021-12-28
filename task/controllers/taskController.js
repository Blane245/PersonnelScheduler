const { body, validationResult } = require('express-validator');
var async = require('async');
const Person = require('../../models/person');
const Leave = require('../../models/leave');
const Person_Training = require('../../models/person_training');
const Job = require('../../models/job');
const Role = require('../../models/role');
const Task = require('../../models/task');
const Training = require('../../models/training');

// this controller does the heavy lifting of the Personnel Scheduling app
// Tasks are what people do. In here are the CRUD controller for tasks
// When a task is created, first the start and end dates are provided
// and then the user is presented with the people of the organization
// alon with their qualifications for each role and their availabilty 
// during the time period. The user then selects one person for each role
// and the task is created. 
// Some options:
//  Display all people for all roles whether qualified or not
//  Display only qualified and available people
// Some bodying:
//  A person can only be a assigned to one role
// During modification of task, the start and end dates may be changed
// revising the qualification/avaiablility list. People may fall on and off the qualification/availabilty list

// I'm sure lots of others things will come up
// The entries of roles and people in the record has a correspondance.

exports.task_list_get = function (req, res, next) {
    async.parallel ({
        // get the job object for this group of tasks
        job: function (callback) {
            Job.findById(req.params.id).exec(callback);},
        // get the tasks for this job
        tasks: function (callback) {
            Task.find({ 'job': req.params.id }).exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); }
        res.render(
            '../views/task_list', 
            { title: "Task List for Job '"+ results.job.name + "'",
             job: results.job, 
             org: results.job.org,
             task_list: results.tasks });

    });

}
// Display job create form on GET.
exports.task_create_get = function(req, res, next) {
    Job.findById(req.params.id)
        .exec(function (err, job) {
        if (err) { return next(err);}
        res.render('task_form', { 
            title: "Create Task for Job '" + job.name + "'",
            job:job    }
        );

    });
};
// Display job create form on GET.
exports.task_create_post = [

    // display must handle two different buttons
    // Save - save the task record without making personnel assignment
    // Assign - save the task record and then present a dialog to make personnel assignments to roles
    // first to a save
    // validate and sanitize fields
    body('name', 'Name must not be empty.').trim().isLength({min: 1}),
    body('description', '').trim(),
    body('startDate', 'Start Date must be a valid date.').isISO8601().toDate(),
    body('endDate', 'End Date must be a valid date.').isISO8601().toDate()
    .custom((value, { req }) => {
        if (value < req.body.startDate) {
            throw new Error('End Date must be greater than or equal to Start Date.');
        }
        return true;
    }),
    // prevent a new job from having the same name as a current one

    // save the new task unless it has the same name as another task for this job
    (req, res, next) => {

        // Extract the validation errors from a request.
        var errors = validationResult(req).array();

        // get the job that this tasks belongs to
        Job.findById(req.params.id).exec(function(err, job) {
            if (err) { return next(err);}

            // check for duplicate task in this job
            Task.findOne({'name': req.body.name, 'job': req.params.id}).exec (function (err, task) {
                if (err) { return next(err)};
                if (task) {
                    errors.push({msg: 'A task with this name already exist for this job.'});
                }

                // create an task object with escaped and trimmed data
                var persons = [];
                persons.length = job.roles.length;
                var task = new Task ( 
                    { name: req.body.name,
                        description: req.body.description,
                        startDate: req.body.startDate,
                        endDate: req.body.endDate,
                        roles: job.roles,
                        persons: persons,
                        job: job
                    });
            
                if (errors.length !=0) {
                    res.render('task_form', {
                        title: "Create Task for Job '" + job.name + "'", 
                        task: task,
                        job: job,
                        errors: errors });
                } else {
                    
                    // data is valid and sanitized. save it
                    task.save(function (err) {
                        if (err) { return next (err);}
                        req.params.taskid = task.id;
                    });

                    // if the assign button was pressed, then do the role assignment activity
                    // otherwise go back to the task list
                    if (req.params.assign == null)
                        res.redirect('/jobs/job/'+req.params.id+'/tasks/');
                    else {

                        // pick up the task record's key and editting the assignment list
                        task_assign_get (req, res, next);
                        // this will never return
                    }
                }
            });
        });
    }
]

// Display training modify form on GET.
exports.task_modify_get = function(req, res, next) {
    async.parallel(
        {
            task: function(callback) {
                Task.findById(req.params.taskid).populate('job').exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            res.render('task_form', { 
                title: "Modify task '" + results.task.name + "' for job '"+results.task.job.name+"'", 
                job: results.task.job,
                task: results.task});    
        }
    );

};

exports.task_modify_post = [
    // validate and sanitze fields.
    body('name', 'Name must not be empty.').trim().isLength({min: 1}),
    body('startDate', 'Start date must be a valid date.').isDate(),
    body('description', '').trim(),
    body('endDate', 'End Date must be a valid date.').isDate()
    .custom((value, { req }) => {
        if (value < req.body.startDate) {
            throw new Error('End Date must be greater than or equal to Start Date.');
        }
        return true;
    }),

    // process request after validation and sanittzation
    (req, res, next) => {
        var errors = validationResult(req).array();

        // get the existing task record for modification
        Task.findById(req.params.taskid).populate('job').exec(function (err, task) {
            if (err) { next(err); console.log(err);}
            // check if there is another task with this name in the job
            Task.findOne({'name': req.body.name, 'job': task.job})
                .exec (function (err, anotherTask) {
                if (err) {return next(err);}
                if (anotherTask && anotherTask.id != task.id) {
                    errors.push ({msg:'Another task with this name exists in the job'});
                }


                var newTask = new Task (
                    { name: req.body.name,
                    description: req.body.description,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    job: task.job.id,
                    persons: task.persons,
                    roles: task.roles,
                    _id: req.params.taskid
                    });
            
                if (errors.length != 0) {
                    res.render('task_form', { 
                        title: "Modify task '" + task.name + "' for job '" + task.job.name + "'", 
                        task: newTask,
                        job: task.job,    
                        errors: errors });
                } else {

                    // data is valid. update the record
                    Task.findByIdAndUpdate(req.params.taskid, newTask, {}, function (err) {
                        if (err) { return next(err); };
                        if (req.params.assign == null)
                            res.redirect('/jobs/job/'+req.params.id+'/tasks/');
                        else {

                            // pick up the task record's key and editting the assignment list
                            task_assign_get (req, res, next);
                        }
                    });
                }
            });
        });
    }
]

// modify the role/person list for a task
// the task is in req.params.id
// the roles are obtains from the job record for the task
// the persons array should in the same order as the roles array
// only one person can be assign to each role
// a person can only be assign to one role
// each person has a qualification and availability tag
exports.task_assign_get =  function (req, res, next) {
    // an array with each entry being a role with an array of person qualifications
    // rolepersons = [{name: role.name, id:role.id, persons:[{name: person.fullName, id: person.id, qualified:qualified, available:available, selected:selected }]}]
    // the POST request returns [Role#,person.id] in role order

    // get the organization of the task's job
    Job.findById(req.params.id).populate('role').exec(function (err, job) {
        if (err) { return next(err);}

        // get the persons of the organization
        Person.find({'organzation': job.organization.id}).exec(function (err, orgPersons) {
            if (err) { return next(err);}

            Task.findById(req.params.taskid).populate('persons').populate('roles').exec(function (err, task) {
                if (err) { return next(err);}

                // we need to body each person's availability for the task
                // and then if they are available, then body their qaulification for each role

                // process each role for the job in turn
                var irole = 0
                var rolepersons = [];
                for (const role in task.roles) {

                    Role.findById(role.id).populate('trainings').exec(function (err, thisRole) {
                        if (err) {next(err);}
                        var roleName = thisRole.name;
                        var roleid = thisRole.id;
                        var roleTrainings = thisRole.trainings;
                        var rolePersons = thisRole.persons;

                        // build the persons array for each role
                        var personData = [];
                        for (const person in orgPersons) {

                            var personName = person.fullName;
                            var personId = person.id;

                            // body leaves for availability
                            var available = false;
                            Leave.find({'person':person.id}).exec(function (err, leaves) {
                                if (err) {return next (err);}
                                available = isAvailable(task.startDate, task.endDate, leaves);
                            });

                            // get a persons trainings and body trainings for qualifications for role
                            var qualified = false;
                            Person_Training.find({'person':person.id}).expand('training').exec(function (err, person_trainings){
                                if (err) {return next (err);}
                                qualified = isQualified(task.endDate, thisRole, roleTrainings, person_trainings)
                            });

                            var selected = isSelected (irole, rolePersons, person);

                            personData.push (
                                {name: personName, 
                                id: personId, 
                                qualified: qualified, 
                                available: available, 
                                selected: selected});
                        }
                        rolepersons.push ({
                            name: roleName,
                            id: roleid,
                            persons: personData
                        });
                    });
                    irole++;
                }

                // ready to display the task assignment page
                res.render('task_assignment_form', { 
                    title: 'Assign Personal for Task "' + task.name + '" of Job ' + job.name + '"',
                    roles: rolepersons});
            });
        });
    });
       
}

//some helper functions
// isAvaialble - bodys all of the leaves to see if any of them overlap with the start and end dates
function isAvailable (startDate, endDate, leaves) {

    var available = true;
    for (const leave in leaves) {
        if (leave.startDate <= endDate && leave.endDate && leave.endDate > startDate)
            available = false;
        if (leave.startDate <= endDate && !leave.endDate)
            available = false;
        if (!available) break;

    }
    return available;

}

// isQualified - for a person to be qualified, all of their role's equired training
// record must not expire before the end date of teh task
function isQualified (endDate, role, role_trainings, person_trainings) {
    var qualified = true;

    // now body the person's training records against those required
    for (const person_training in person_trainings) {

        for (const required_training in role_trainings) {

            // skip if this training is not relavent
            if (required_training.name == person_training.name) {
                if (person_training.expirationDate && person_training.expirationDate <= endDate) {
                    qualified = false;
                    break;
                }

            }
        }

        if (!qualified)
            break;
    }
    return qualified;
}


// see if a person is selected for a role 
function isSelected (irole, persons, person) {
    return (person == persons[irole]);

}

// handle POST for task/person assignments
exports.task_assign_post =  function (req, res, next) {

    // there is nothing to validate or sanitize

    // build up the new task record from the existing one and the new
    // assignment values
    var task;
    Task.findById(req.params.taskid).exec(function (err, result) {
        if (err) { return next(err);}
        task = result;
    });

    var job;
    Task.findById(req.params.taskid).expand('roles').exec(function (err, result) {
        if (err) { return next(err);}
        job = result;
    });

    // loop through the roles applicable to the job and retrieve the selected
    // person for each role
    var irole = 0;
    var pickedPersons = [];
    for (const role in task.roles) {
        var groupName = 'Role' + irole.toString();
        pickedPersons.push(req.params[groupName]);
        irole++;
    }

    newTask = new Task ({
        name: task.name,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        job: task.job,
        persons: pickedPersons,
        roles: task.roles,
        _id: task.id
    });

    // update the task record and display the task list page
    Task.findByIdAndUpdate(task.id, newTask, {}, function (err) {
        if (err) { return next(err); }
        res.redirect('/jobs/job/'+req.params.id+'/tasks/');
    });

}
// Display training delete form on GET.
exports.task_delete_get = function(req, res, next) {

    async.parallel({
        task: function(callback) {
            Task.findById(req.params.taskid).exec(callback)},
        job: function(callback) {
                Job.findById(req.params.id).exec(callback)}
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('task_delete', { 
            title: "Delete task '" + results.task.name + "' from job '" + results.job.name + "'" ,
            job: results.job,
            task: results.task} );
    });

};

// Handle task delete on POST.
exports.task_delete_post = function(req, res, next) {

    async.parallel({
        task: function(callback) {
          Task.findById(req.params.taskid).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        Task.findByIdAndRemove(req.params.taskid, function (err) {
            if (err) { return next(err); }
            res.redirect('/jobs/job/'+req.params.id+'/tasks');
        })
    });
};

