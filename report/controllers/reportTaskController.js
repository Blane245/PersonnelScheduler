var Organization = require('../../models/organization');
var Job = require('../../models/job');
var Task = require('../../models/task');
var async = require('async');
exports.report_task_all = function (req,res,next, now) {

    async.parallel ({
        // organizations
        orgs: function (callback) {
            Organization.find({}).sort('name').exec(callback);},
        // jobs
        jobs: function (callback) {
            Job.find({}).sort('name').exec(callback);},
        // tasks
        tasks: function (callback) {
            Task.find({}).populate('roles').populate('persons').sort('startDate').exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); }

        // the report goes by each organization, job, task
        var report_data = [];
        for (let i = 0; i < results.orgs.length; i++) {
            report_data.push({
                org: results.orgs[i],
                job_data:[]
            });
            var nJobs = 0;
            for (let j = 0; j < results.jobs.length; j++) {

                // match the job to this org record
                if (results.orgs[i]._id.toString() == results.jobs[j].organization.toString()) {
                    report_data[i].job_data.push({
                        job: results.jobs[j], 
                        task_data:[]
                    });

                
                    // get the matching task records
                    for (let k = 0; k < results.tasks.length; k++) {
                        if (results.jobs[j]._id.toString() == results.tasks[k].job.toString())
                            report_data[i].job_data[nJobs].task_data.push({
                                task: results.tasks[k],
                                available: false,
                                qualified: false
                            });
                    }
                    nJobs++;
                }
            }
        }

        // render the report
        res.render('report_task_records', { 
            title: 'All Tasks for All organizations', 
            dateTime: now,
            report_data: report_data,
        });
    });

}

exports.report_task_org = function (req,res,next, now) {
        
    Organization.findById(req.body.orgtask).exec(function (err, org) {
        if (err) { return next(err); }
        Job.find({'organization':req.body.orgtask}).sort('name').exec(function(err, jobs) {
            if (err) { return next(err); }
            Task.find({'job':jobs}).sort('startDate').populate('roles').populate('persons').exec(function(err,tasks) {
                if (err) { return next(err); }

                // the report goes by job, task
                var report_data = [];
                report_data.push ({org: org, job_data: []});
                for (let i = 0; i < jobs.length; i++) {
                    report_data[0].job_data.push({
                        job: jobs[i],
                        task_data:[]
                    });
                    for (let j = 0; j < tasks.length; j++) {

                        // match the task to this job record
                        if (jobs[i]._id.toString() == tasks[j].job.toString()) {
                            report_data[0].job_data[i].task_data.push({
                                task: tasks[j], 
                                available: false,
                                qualified: false
                            });
                        }
                    }
                }

                // render the report
                res.render('report_task_records', { 
                    title: 'Tasks for One Organization', 
                    dateTime: now,
                    report_data: report_data,
                });

            });
        });
    });

}
exports.report_task_job = function (req,res,next, now) {
    Job.findById(req.body.jobtask).populate('organization').exec(function(err, job) {
        if (err) { return next(err); }
        Task.find({'job':job}).sort('startDate').populate('roles').populate('persons').exec(function(err,tasks) {
            if (err) { return next(err); }

            // the report goes by job, task
            var report_data = [];
            report_data.push ({org: job.organization, job_data: []});
            report_data[0].job_data.push({
                job: job,
                task_data:[]
                });
            for (let j = 0; j < tasks.length; j++) {
                report_data[0].job_data[0].task_data.push({
                    task: tasks[j], 
                    available: false,
                    qualified: false
                });
            }

            // render the report
            res.render('report_task_records', { 
                title: 'Tasks for One Job', 
                dateTime: now,
                report_data: report_data,
            });
        });
    });
}
