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
    let report_data = [];
    for (let org of orgs) {
        report_data.push({
            org: org,
            job_data:[]
        });
        let nJobs = 0;
        for (let job of jobs) {
            // match the job to this org record
            if (org._id.toString() == job.organization.toString()) {
                report_data[report_data.length-1].job_data.push({
                    job: job, 
                    task_data:[]
                });

                // get the matching task records

                for (let task of tasks) {

                    // select the tasks for this job
                    if (job._id.toString() == task.job._id.toString()){

                        // go through all of the role/person pairs
                        let roleData = []
                        roleData.length = task.roles.length;
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

                                            // get the person avaiability and qaulifications
                                            var availability = helpers.Availability(
                                                task.startDateTime_formatted, 
                                                task.endDateTime_formatted, 
                                                task.id, 
                                                taskPerson.id, 
                                                leaves, 
                                                tasks);
                                            var qualification= helpers.Qualification(
                                                task.endDateTime_formatted, 
                                                scanRole.trainings, 
                                                person_trainings, 
                                                taskPerson.id);
                                            roleData[iRole] = {
                                                    person: taskPerson,
                                                    role: taskRole,
                                                    qualification: qualification,
                                                    availability: availability}
                                        }
                                    }
                                }
                            }
                            iRole++;
                            
                        }
                        report_data[report_data.length-1].job_data[nJobs].task_data.push({
                            task: task,
                            roleData: roleData,
                        });
                        nJobs++;
                    }
                }
            }
        }
    }

    // before rendering, the javascript for the calender needs to be generated
    let PrefixFile = 'public/javascripts/LocalCalendarPrefix.js';
    let SuffixFile = 'public/javascripts/LocalCalendarSuffix.js';
    let ExtensionFile = 'public/javascripts/LocalCalendarExtensions.js';
    let scriptData = build_calendar_script (report_data, PrefixFile, SuffixFile, ExtensionFile)
    res.render('report_task_calendar', { 
        title: 'Task Calendar for all organizations', 
        dateTime: '',
        scriptData: scriptData,});

}

// I could not find a way for pug to build the javascript file necessary
// to put the event on the calendar, so here goes
//TODO for some reason pug is putting in the script and then putting it in again as text.
function build_calendar_script (report_data, prefix, suffix, extension) {
    const fs = require('fs');
    
    let scriptData = '<script>\n' + fs.readFileSync (prefix);
    for (let item of report_data) {
        for (let job_item of item.job_data) {
            for (let task_item of job_item.task_data) {
                scriptData+= 
                "calendar.addEvent({\n" +
                "       title:'" + task_item.task.name + "',\n" +
                "       start: '" +  task_item.task.startDateTime_formatted + "',\n" +
                "       end: '" +  task_item.task.endDateTime_formatted + "',\n" +
                "       id: 'r" +  task_item.task.id + "',\n" +
                "       extendProps: {\n"+
                "           orgName:'" + item.org.name + "',\n" +
                "           jobName:'" + job_item.job.name+ "',\n" +
                "           roleInfo:[\n";
                for (let role_item of task_item.roleData) {
                    // first the person and role identification
                    scriptData+= 
                    "              {role: '" + role_item.role.name + "',\n" +
                    "              person:'" + role_item.person.fullName+ "',\n" +
                    "              qualified:'" + role_item.qualification.qualified+ "',\n" +
                    "              available:'" + role_item.availability.available+ "',\n" +
                    "              qualificationReasons:[\n";
                    // now the qualification reasons
                    for (let reason of role_item.qualification.reasons) {
                        scriptData+="                   '" + reason + "',\n";
                    }
                    scriptData+="           ],\n";        /* close qualification reasons */
                    
                    // now the availbility
                    scriptData+= 
                    "               availabilityReasons:[\n";
                    for (let reason of role_item.availability.reasons) {
                        scriptData+="                   '" + reason + "',\n";
                    }
                    scriptData+="           ],\n";        /* close availability reasons */
                    scriptData+="           },\n";        /* close role */
                    
                }
                scriptData+=
                "       ]\n"; /* close roleInfo */
                scriptData+= 
                "    }\n" /* close extended Props */
                scriptData+= 
                "    });\n" /* close addEvent */
            }
        }
    }
    scriptData+= fs.readFileSync (suffix);
    scriptData+= fs.readFileSync (extension);
    scriptData+= '</script>';

    return scriptData;
}