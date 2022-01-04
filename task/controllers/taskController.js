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
             tasks: results.tasks });

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
    body('startDate', 'Start Date must be a valid date.').isISO8601(),
    body('endDate', 'End Date must be a valid date.').isISO8601()
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
                for (let i = 0; i < job.role.length; i++)
                    persons[i] = new Person();
                var task = new Task ( 
                    { name: req.body.name,
                        description: req.body.description,
                        startDate: req.body.startDate,
                        endDate: req.body.endDate,
                        roles: job.role,
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
                        req.params.taskid = task._id;

                        // if the assign button was pressed, then do the role assignment activity
                        // otherwise go back to the task list
                        if (req.body.assign == null)
                            res.redirect('/jobs/job/'+req.params.id+'/tasks/');
                        else {
                            res.redirect('/tasks/job/'+req.params.id+'/task/'+req.params.taskid+'/assign');
                        }
                    });
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
    body('startDate', 'Start date must be a valid date.').isISO8601(),
    body('description', '').trim(),
    body('endDate', 'End Date must be a valid date.').isISO8601()
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
                        if (req.body.assign == null)
                            res.redirect('/jobs/job/'+req.params.id+'/tasks/');
                        else {
                            res.redirect('/tasks/job/'+req.params.id+'/task/'+newTask._id+'/assign');
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
        Person.find({'organization': job.organization}).exec(function (err, orgPersons) {
            if (err) { return next(err);}

            Task.findById(req.params.taskid).populate('roles').exec(function (err, task) {
                if (err) { return next(err);}

                // get all the leaves for all of the people in the organization
                Leave.find({'person': orgPersons}).exec(function (err, leaves) {
                    if (err) { return next(err);}
                    // get all the person_trainings for all of the people in the organization
                    Person_Training.find({'person': orgPersons}).exec(function (err, person_trainings) {
                        // we need to check each person's availability for the task
                        // and then if they are available, then check their qualification for each role

                        // process each role for the job in turn
                        var rolepersons = [];
                        var taskPersons = task.persons;
                        if (taskPersons.length == 0)
                            taskPersons.length = task.roles.length;
                        for (let irole = 0; irole < task.roles.length; irole++) {
                            var roleName = task.roles[irole].name;
                            var roleid = task.roles[irole].id;
                            var roleTrainings = task.roles[irole].trainings;

                            // build the persons array for each role
                            var personData = [];
                            for (let iperson = 0; iperson < orgPersons.length; iperson++){

                                var personName = orgPersons[iperson].fullName;
                                var personId = orgPersons[iperson].id;
                                
                                // TODO check other tasks to see if the person is assigned to another task
                                var available = isAvailable(task.startDate_formatted, task.endDate_formatted, orgPersons[iperson].id, leaves);
                                var qualified = isQualified(task.endDate, roleTrainings, person_trainings, orgPersons[iperson].id);

                                // see if the person is currently selected
                                var selected = isSelected (irole, taskPersons, orgPersons[iperson]);
                                // pile up the data on this person
                                personData.push (
                                    {name: personName, 
                                    id: personId, 
                                    qualified: qualified, 
                                    available: available, 
                                    selected: selected});
                            }

                            // pile up the data on this role
                            rolepersons.push ({
                                name: roleName,
                                id: roleid,
                                persons: personData
                            });
                        }
                        
                        // ready to display the task assignment page
                        res.render('task_assignment_form', { 
                            title: "Assign Personnel for Task '" + task.name + "' of Job '" + job.name + "'",
                            job:job,
                            roles: rolepersons});

                    });
                });

            });
        });
    });
}

//some helper functions
// isAvaialble - bodys all of the leaves to see if any of them overlap with the start and end dates
function isAvailable (startDate, endDate, person, leaves) {

    var available = true;
    for (let i = 0; i < leaves.length; i++) {
        if (leaves[i].person == person) {
            // console.log('leave start: ', leaves[i].startDate_formatted);
            // console.log('leave end: ', leaves[i].endDate_formatted);
            // console.log('task start: ', startDate);
            // console.log('leave start: ', endDate);
            if (leaves[i].startDate_formatted <= endDate && leaves[i].endDate && leaves[i].endDate_formatted > startDate)
                available = false;
            if (leaves[i].startDate_formatted <= endDate && !leaves[i].endDate)
                available = false;
            if (!available) break;

        };

    }
    return available;

}

// isQualified - for a person to be qualified, all of their role's equired training
// record must not expire before the end date of the task
function isQualified (endDate, role_trainings, person_trainings, person) {
    var qualified = false;
    var nQuals = 0;
    // console.log(person.toString());
    // now check the person's training records against those required
    for (let irt = 0; irt < role_trainings.length; irt++) {
        // console.log(role_trainings[irt].toString());
        for (let ipt = 0; ipt < person_trainings.length; ipt++) {
            // console.log(person_trainings[ipt].training.toString());
            // console.log(person_trainings[ipt].person.toString());
            // skip if this training is not for the person being processed
            if ( role_trainings[irt].toString() == person_trainings[ipt].training.toString() && person.toString() == person_trainings[ipt].person.toString()) {
                if (person_trainings[ipt].expirationDate && person_trainings[ipt].expirationDate <= endDate) 
                    {}
                else
                    nQuals++;

            }
        }
    }

    // person must have all required training for a role
    if (nQuals == role_trainings.length)
        qualified = true;
    return qualified;
}


// see if a person is selected for a role 
function isSelected (irole, persons, person) {
    return (persons[irole] && person.id == persons[irole]);

}

// handle POST for task/person assignments
exports.task_assign_post =  function (req, res, next) {


    // build up the new task record from the existing one and the new
    // assignment values
    Task.findById(req.params.taskid).exec(function (err, task) {
        if (err) { return next(err);}

        // loop through the roles retrieve the selected person for each role
        var irole = 0;
        var pickedPersons = [];
        for (const role in task.roles) {
            var groupName = 'Role' + irole.toString();
            if (req.body[groupName] != '')
                pickedPersons.push(req.body[groupName]);
            else {
                const person = new Person();
                pickedPersons.push(person.id);
            }
            irole++;
        }

        // build the new task record with the person assignment updates
        newTask = new Task ({
            name: task.name,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            job: task.job,
            roles: task.roles,
            _id: task.id
        });
        for (let i = 0; i < task.roles.length; i++) {
            newTask.persons[i] = pickedPersons[i];
        }

        // update the task record and display the task list page
        Task.findByIdAndUpdate(task.id, newTask, {}, function (err) {
            if (err) { return next(err); }
            res.redirect('/jobs/job/'+req.params.id+'/tasks/');
        });
    });

}

// Handle task delete on POST.
exports.task_delete_get = function(req, res, next) {

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

