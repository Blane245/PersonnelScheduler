// this use FullCalendar to display the events 
var Organization = require('../../models/organization');
var Job = require('../../models/job');
var Role = require('../../models/role');
var Task = require('../../models/task');
var Person = require('../../models/person');
var Leave = require('../../models/leave');
var Person_Training = require('../../models/person_training');
var helpers = require('../../helpers/helpers');
exports.report_task_calendar = async function (req,res,next, now) {

    let orgs = null;
    try {
        orgs = await Organization.find({});
    } catch (error) { if (error) return(next(error));}

    let persons = null;
    try {
        persons = await Person.find({});
    } catch (error) { if (error) return(next(error));}

    let jobs = null;
    try {
        jobs = await Job.find({});
    } catch (error) { if (error) return(next(error));}

    let tasks = null;
    try {
        tasks = await Task.find({}).populate('roles').populate('persons');
    } catch (error) { if (error) return(next(error));}

    let leaves = null;
    try {
        leaves = await Leave.find({});
    } catch (error) { if (error) return(next(error));}

    let person_trainings = null;
    try {
        person_trainings = await Person_Training.find({});
    } catch (error) { if (error) return(next(error));}

    let roles = null;
    try {
        roles = await Role.find({}).populate('trainings');
    } catch (error) { if (error) return(next(error));}

    // the report goes by each organization, job, task
    let eventData = [];
    for (let org of orgs) {
        for (let job of jobs) {
            // match the job to this org record
            if (org._id.toString() == job.organization.toString()) {

                // get the matching task records

                for (let task of tasks) {

                    // select the tasks for this job
                    if (job._id.toString() == task.job._id.toString()){

                        // format the event header
                        eventData.push ({
                            title: task.name,
                            start: task.startDateTime_formatted,
                            end: task.endDateTime_formatted,
                            id: 'r' + task._id,
                            extendProps: {
                                orgName: org.name,
                                jobName: job.name,
                                roleInfo: []}
                        });
                        let iRole = 0;
                        for (let taskRole of task.roles){
                            let taskPerson = task.persons[iRole];

                            // find the role that matches this one
                            for (let scanRole of roles) {
                                if (scanRole.id.toString() == taskRole.id.toString()) {

                                    // find the person for this role
                                    for (let scanPerson of persons){
                                        if (scanPerson.id.toString() == 
                                            taskPerson.id.toString()) {

                                            // get the person availability and qualification for this task
                                            let availability = helpers.Availability(
                                                task.startDateTime_formatted, 
                                                task.endDateTime_formatted, 
                                                task.id, 
                                                taskPerson.id, 
                                                leaves, 
                                                tasks);
                                            let qualification= helpers.Qualification(
                                                task.endDateTime_formatted, 
                                                scanRole.trainings, 
                                                person_trainings, 
                                                taskPerson.id);
                                            eventData[eventData.length - 1].extendProps.roleInfo.push({
                                                role: taskRole.name,
                                                person: taskPerson.fullName,
                                                qualified: qualification.qualified,
                                                available: availability.available,
                                                qualificationReasons: qualification.reasons,
                                                availabilityReasons:availability.reasons});
                                        }
                                    }
                                }
                            }
                            iRole++;
                            
                        }
                    }
                }
            }
        }
    }

    res.render('report_task_calendar', { 
        title: 'Task Calendar for all organizations', 
        dateTime: '',
        eventData:eventData,});

}