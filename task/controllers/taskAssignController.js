const Person = require('../../models/person');
const Leave = require('../../models/leave');
const Person_Training = require('../../models/person_training');
const Job = require('../../models/job');
const Training = require('../../models/training');
const Task = require('../../models/task');
const helpers = require('../../helpers/helpers');
const { validationResult } = require('express-validator');

// modify the role/person list for a task
// the task is in req.params.id
// the roles are obtains from the job record for the task
// the persons array should in the same order as the roles array
// only one person can be assign to each role
// a person can only be assign to one role
// each person has a qualification and availability tag
exports.task_assign_get =  async function (req, res, next) {
    // an array with each entry being a role with an array of person qualifications
    // rolepersons = [{name: role.name, id:role.id, persons:[{name: person.fullName, id: person.id, qualified:qualified, available:available, selected:selected }]}]
    // the POST request returns [Role#,person.id] in role order


    // get the task being processed and its roles
    let task = null;
    try {
        task = await Task.findById(req.params.taskid).populate('roles');
    } catch (error) {
        if (error) return(next(error));
    }

    // get the job of the task
    let job = null;
    try {
        job = await Job.findById(req.params.id).populate('role');
    } catch (error) {
        if (error) return(next(error));
    }

    // get the persons of the organization
    let orgPersons = null;
    try {
        orgPersons = await Person.find({'organization': job.organization});
    } catch (error) {
        if (error) return(next(error));
    }

    // get all the leaves for all of the people in the organization
    let leaves = null;
    try {
        leaves = await Leave.find({'person': orgPersons});
    } catch (error) {
        if (error) return(next(error));
    }

    // get all the person_trainings for all of the people in the organization
    let person_trainings = null;
    try {
        person_trainings = await Person_Training.find({'person': orgPersons}).populate('training');
    } catch (error) {
        if (error) return(next(error));
    }

    // finally get all of defined tasks
    let tasks = null;
    try {
        tasks = await Task.find({});
    } catch (error) {
        if (error) return(next(error));
    }

    // we need to check each person's availability for the task
    // and then check their qualification for each role

    // process each role for the job in turn
    let rolepersons = [];
    let taskPersons = task.persons;
    if (taskPersons.length == 0)
        taskPersons.length = task.roles.length;
    let iRole = 0;
    // for (let iRole = 0; i < task.roles.length; i++)
    //     const role = task.roles[iRole];
    for (let role of task.roles) {
        const roleName = role.name;
        const roleid = role.id;

        // get the trainings for the roles
        let roleTrainings = null;
        try {
            roleTrainings = await Training.find({'_id': {$in: role.trainings}});
        } catch (error) {
            if (error) return(next(error));
        }

        // build the persons array for each role
        let personData = [];
        for (let person of orgPersons) {

            const personName = person.fullName;
            const personId = person.id;
            
            const availability = helpers.Availability(
                task.startDateTime_formatted, 
                task.endDateTime_formatted, 
                task.id, 
                person.id, leaves, tasks);
            const qualification= helpers.Qualification(
                task.endDateTime_formatted, 
                roleTrainings, 
                person_trainings, 
                person.id);

            // see if the person is currently selected
            const selected = (taskPersons[iRole] && person.id == taskPersons[iRole]);
            // pile up the data on this person
            personData.push (
                {name: personName, 
                id: personId, 
                qualification: qualification, 
                availability: availability, 
                selected: selected});
        }

        // pile up the data on this role
        rolepersons.push ({
            name: roleName,
            id: roleid,
            persons: personData
        });
        iRole++;
    }
    // ready to display the task assignment page
    res.render('task_assignment_form', { 
        title: "Assign Personnel for Task '" + task.name + "' of Job '" + job.name + "'",
        job: job,
        task: task,
        roles: rolepersons});
}


// handle POST for task/person assignments
exports.task_assign_post =  async function (req, res, next) {


    // build up the new task record from the existing one and the new
    // assignment values
    let task = null;
    try {
        task = await Task.findById(req.params.taskid);
    } catch (error) {
        if (error) return(next(error));
    }

    // loop through the roles retrieve the selected person for each role
    // if none selected, add a dummy person
    let irole = 0;
    let pickedPersons = [];
    for (const role in task.roles) {
        let groupName = 'Role' + irole.toString();
        if (req.body[groupName] != '')
            pickedPersons.push(req.body[groupName]);
        else {
            pickedPersons.push(new Person().id);
        }
        irole++;
    }

    // build the new task record with the person assignment updates
    newTask = new Task ({
        name: task.name,
        description: task.description,
        startDateTime: task.startDateTime,
        endDateTime: task.endDateTime,
        job: task.job,
        roles: task.roles,
        persons: pickedPersons,
        _id: task.id
    });

    // update the task record and display the task list page
    Task.findByIdAndUpdate(task.id, newTask, {}, function (err) {
        if (err) { return next(err); }
        res.redirect('/jobs/job/'+req.params.id+'/tasks/');
    });

}