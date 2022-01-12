var Organization = require('../../models/organization');
var Job = require('../../models/job');
var Role = require('../../models/role');
var Task = require('../../models/task');
var Person = require('../../models/person');
var Leave = require('../../models/leave');
var Person_Training = require('../../models/person_training');
var helpers = require('../../helpers/helpers');
var async = require('async');
exports.report_task_all = function (req,res,next, now) {

    async.parallel ({
        // organizations
        orgs: function (callback) {
            Organization.find({}).sort('name').exec(callback);},
        // persons
        persons: function (callback) {
            Person.find({}).sort('name').exec(callback);},
        // jobs
        jobs: function (callback) {
            Job.find({}).sort('name').exec(callback);},
        // tasks
        tasks: function (callback) {
            Task.find({}).populate('roles').populate('persons').sort('startDate').exec(callback);},
        leaves: function (callback) {
            Leave.find({}).exec(callback);},
        person_trainings: function (callback) {
            Person_Training.find({}).exec(callback);},
        roles: function (callback) {
            Role.find({}).populate('trainings').exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); }

        // the report goes by each organization, job, task
        var report_data = [];
        for (let i = 0; i < results.orgs.length; i++) {
            var org = results.orgs[i];
            report_data.push({
                org: org,
                job_data:[]
            });
            var nJobs = 0;
            for (let j = 0; j < results.jobs.length; j++) {
                var job = results.jobs[j];
                // match the job to this org record
                if (org._id.toString() == job.organization.toString()) {
                    report_data[i].job_data.push({
                        job: job, 
                        task_data:[]
                    });

                    // get the matching task records

                    for (let k = 0; k < results.tasks.length; k++) {
                        var task = results.tasks[k];

                        // select the tasks for this job
                        if (job._id.toString() == task.job._id.toString()){

                            // go through all of the role/person pairs
                            var roleData = []
                            roleData.length = task.roles.length;
                            for (let l = 0; l < task.roles.length; l++){
                                var taskRole = results.tasks[k].roles[l];
                                var taskPerson = results.tasks[k].persons[l];

                                // find the role that matches this one
                                for (let m = 0; m < results.roles.length; m++) {
                                    var scanRole = results.roles[m];

                                    if (scanRole.id.toString() == taskRole.id.toString()) {

                                        // find the person for this role
                                        for (let n = 0; n < results.persons.length; n++){
                                            var scanPerson = results.persons[n];
                                            if (scanPerson.id.toString() == 
                                                taskPerson.id.toString()) {

                                                // get the person avaiability and qaulifications
                                                var availability = helpers.Availability(
                                                    task.startDateTime_formatted, 
                                                    task.endDateTime_formatted, 
                                                    task.id, 
                                                    taskPerson.id, 
                                                    results.leaves, 
                                                    results.tasks);
                                                var qualification= helpers.Qualification(
                                                    task.endDateTime_formatted, 
                                                    scanRole.trainings, 
                                                    results.person_trainings, 
                                                    taskPerson.id);
                                                roleData[l] = {
                                                        person: taskPerson,
                                                        role: taskRole,
                                                        qualification: qualification,
                                                        availability: availability}
                                            }
                                        }
                                    }
                                }
                                
                            }
                            report_data[i].job_data[nJobs].task_data.push({
                                task: results.tasks[k],
                                roleData: roleData,
                            });
                            nJobs++;
                        }
                    }
                }
            }
        }
        // render the report
        res.render('report_task_records', { 
            title: 'All Tasks for all organizations', 
            dateTime: now,
            report_data: report_data,});
    });

}

exports.report_task_org = function (req,res,next, now) {
        
    async.parallel ({
        // organizations
        org: function (callback) {
            Organization.findById(req.body.orgtask).sort('name').exec(callback);},
        // persons
        persons: function (callback) {
            Person.find({'organization': req.body.orgtask}).sort('name').exec(callback);},
        // jobs
        jobs: function (callback) {
            Job.find({'organization': req.body.orgtask}).sort('name').exec(callback);},
        // tasks
        tasks: function (callback) {
            Task.find({}).populate('roles').populate('persons').sort('startDate').exec(callback);},
        leaves: function (callback) {
            Leave.find({}).exec(callback);},
        person_trainings: function (callback) {
            Person_Training.find({}).exec(callback);},
        roles: function (callback) {
            Role.find({}).populate('trainings').exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); }

        // the report goes by each organization, job, task
        let report_data = [];
        report_data.push({
            org: results.org,
            job_data:[]
        });

        let nJobs = 0;
        for (let j = 0; j < results.jobs.length; j++) {
            let job = results.jobs[j];
            report_data[0].job_data.push({
                job: job, 
                task_data:[]
            });

            // get the matching task records

            for (let k = 0; k < results.tasks.length; k++) {
                const task = results.tasks[k];

                // select the tasks for this job
                if (job._id.toString() == task.job._id.toString()){

                    // go through all of the role/person pairs
                    let roleData = []
                    roleData.length = task.roles.length;
                    for (let l = 0; l < task.roles.length; l++){
                        const taskRole = results.tasks[k].roles[l];
                        const taskPerson = results.tasks[k].persons[l];

                        // find the role that matches this one
                        for (let m = 0; m < results.roles.length; m++) {
                            const scanRole = results.roles[m];

                            if (scanRole.id.toString() == taskRole.id.toString()) {

                                // find the person for this role
                                for (let n = 0; n < results.persons.length; n++){
                                    const scanPerson = results.persons[n];
                                    if (scanPerson.id.toString() == 
                                        taskPerson.id.toString()) {

                                        // get the person avaiability and qaulifications
                                        const availability = helpers.Availability(
                                            task.startDateTime_formatted, 
                                            task.endDateTime_formatted, 
                                            task.id, 
                                            taskPerson.id, 
                                            results.leaves, 
                                            results.tasks);
                                        const qualification= helpers.Qualification(
                                            task.endDateTime_formatted, 
                                            scanRole.trainings, 
                                            results.person_trainings, 
                                            taskPerson.id);
                                        roleData[l] = {
                                                person: taskPerson,
                                                role: taskRole,
                                                qualification: qualification,
                                                availability: availability}
                                    }
                                }
                            }
                        }
                        
                    }
                    report_data[0].job_data[nJobs].task_data.push({
                        task: results.tasks[k],
                        roleData: roleData,
                    });
                    nJobs++;
                }
            }
        }
        // render the report
        res.render('report_task_records', { 
            title: 'All Tasks for an Organization', 
            dateTime: now,
            report_data: report_data,});
    });
}
exports.report_task_job = function (req,res,next, now) {
    async.parallel ({
        // job
        job: function (callback) {
            Job.findById(req.body.jobtask).sort('name').populate('organization').exec(callback);},
        // persons
        persons: function (callback) {
            Person.find({}).sort('name').exec(callback);},
        // tasks
        tasks: function (callback) {
            Task.find({}).populate('roles').populate('persons').sort('startDate').exec(callback);},
        leaves: function (callback) {
            Leave.find({}).exec(callback);},
        person_trainings: function (callback) {
            Person_Training.find({}).exec(callback);},
        roles: function (callback) {
            Role.find({}).populate('trainings').exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); }

        let report_data = [];
        report_data.push({
            org: results.job.organization,
            job_data:[]
        });

        const job = results.job;
        report_data[0].job_data.push({
                job: job, 
                task_data:[]
        });

        // get the matching task records

        for (let k = 0; k < results.tasks.length; k++) {
            const task = results.tasks[k];

            // select the tasks for this job
            if (job._id.toString() == task.job._id.toString()){

                // go through all of the role/person pairs
                let roleData = []
                roleData.length = task.roles.length;
                for (let l = 0; l < task.roles.length; l++){
                    const taskRole = results.tasks[k].roles[l];
                    const taskPerson = results.tasks[k].persons[l];

                    // find the role that matches this one
                    for (let m = 0; m < results.roles.length; m++) {
                        const scanRole = results.roles[m];

                        if (scanRole.id.toString() == taskRole.id.toString()) {

                            // find the person for this role
                            for (let n = 0; n < results.persons.length; n++){
                                const scanPerson = results.persons[n];
                                if (scanPerson.id.toString() == 
                                    taskPerson.id.toString()) {

                                    // get the person avaiability and qaulifications
                                    const availability = helpers.Availability(
                                        task.startDateTime_formatted, 
                                        task.endDateTime_formatted, 
                                        task.id, 
                                        taskPerson.id, 
                                        results.leaves, 
                                        results.tasks);
                                    const qualification= helpers.Qualification(
                                        task.endDateTime_formatted, 
                                        scanRole.trainings, 
                                        results.person_trainings, 
                                        taskPerson.id);
                                    roleData[l] = {
                                            person: taskPerson,
                                            role: taskRole,
                                            qualification: qualification,
                                            availability: availability}
                                }
                            }
                        }
                    }
                    
                }
                report_data[0].job_data[0].task_data.push({
                    task: results.tasks[k],
                    roleData: roleData,
                });
            }
        }
        // render the report
        res.render('report_task_records', { 
            title: 'All Tasks for a Job', 
            dateTime: now,
            report_data: report_data,});
    });
}
