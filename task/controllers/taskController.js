const { body, validationResult } = require('express-validator');
var async = require('async');
const Person = require('../../models/person');
const Job = require('../../models/job');
const Task = require('../../models/task');

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
    body('startDateTime', 'Start Date must be a valid date.').exists().not().isEmpty(),
    body('endDateTime', 'End Date must be a valid date.').exists().not().isEmpty()
    .custom((value, { req }) => {
        if (value < req.body.startDateTime) {
            throw new Error('End Date must be greater than or equal to Start Date.');
        }
        return true;
    }),
    // prevent a new job from having the same name as a current one

    // save the new task unless it has the same name as another task for this job
    async (req, res, next) => {


        // Extract the validation errors from a request.
        var errors = validationResult(req).array();

        // get the job that this tasks belongs to
        let job = null;
        try {
            job = await Job.findById(req.params.id);
        } catch (error) {
            if (error) return(next(error));
        }

        // check for duplicate task in this job
        let dupTask = null;
        try {
            dupTask = await Task.findOne({'name': req.body.name, 'job': req.params.id});
        } catch (error) {
            if (error) return(next(error));
        }
        if (dupTask) {
            errors.push({msg: 'A task with this name already exist for this job.'});
        }

        // create an task object with escaped and trimmed data
        var persons = [];
        for (let i = 0; i < job.role.length; i++)
            persons[i] = new Person();
        var task = new Task ( 
            { name: req.body.name,
                description: req.body.description,
                startDateTime: req.body.startDateTime,
                endDateTime: req.body.endDateTime,
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

                // if the assign button was pressed, then do the role assignment activity
                // otherwise go back to the task list
                req.params.taskid = task._id;
                if (req.body.assign == null)
                    res.redirect('/jobs/job/'+req.params.id+'/tasks/');
                else {
                    res.redirect('/tasks/job/'+req.params.id+'/task/'+req.params.taskid+'/assign');
                }
            });
        }
    }
]

// Display training modify form on GET.
exports.task_modify_get = async function(req, res, next) {

    let task = null;
    try {
        task = await Task.findById(req.params.taskid).populate('job');
    } catch (error) {
        if (error) return(next(error));
    }
    res.render('task_form', { 
        title: "Modify task '" + task.name + "' for job '"+task.job.name+"'", 
        job: task.job,
        task: task});    

};

exports.task_modify_post = [
    // validate and sanitze fields.
    body('name', 'Name must not be empty.').trim().isLength({min: 1}),
    body('startDateTime', 'Start date must be a valid date.').isISO8601(),
    body('description', '').trim(),
    body('endDateTime', 'End Date must be a valid date.').isISO8601()
    .custom((value, { req }) => {
        if (value < req.body.startDateTime) {
            throw new Error('End Date must be greater than or equal to Start Date.');
        }
        return true;
    }),

    // process request after validation and sanittzation
    async (req, res, next) => {
        var errors = validationResult(req).array();

        // get the existing task record for modification
        let task = null;
        try {
            task = await Task.findById(req.params.taskid).populate('job');
        } catch (error) {
            if (error) return(next(error));
        }

        // check for duplicate
        let dupTask = null;
        try {
            dupTask = await Task.findOne({'name': req.body.name, 'job': task.job});
        } catch (error) {
            if (error) return(next(error));
        }
        if (dupTask && dupTask.id != task.id) {
            errors.push ({msg:'Another task with this name exists in the job'});
        }


        // build the new task record
        var newTask = new Task (
            { name: req.body.name,
            description: req.body.description,
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
            job: task.job.id,
            persons: task.persons,
            roles: task.roles,
            _id: req.params.taskid
            });
    
        // show the form again on error
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
    }
]

// Handle task delete on POST.
exports.task_delete_get = async function(req, res, next) {

    Task.findByIdAndRemove(req.params.taskid, function (err) {
        if (err) { return next(err); }
        res.redirect('/jobs/job/'+req.params.id+'/tasks');
    })
};