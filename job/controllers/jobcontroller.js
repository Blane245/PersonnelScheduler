var Organization = require('../../models/organization');
var Job = require('../../models/job');
var Task = require('../../models/task');
const { body, validationResult } = require('express-validator');
var async = require('async');
const organization = require('../../models/organization');

// the list of jobs for an organization
exports.organization_job_list = function (req, res, next) {
    async.parallel ({
        // get the organization object for this group of jobs
        organization: function (callback) {
            Organization.findById(req.params.orgId).exec(callback);},
        // get the jobs for this organization
        jobs: function (callback) {
            Job.find({ 'organization': req.params.orgId })
            .populate('organization')
            .exec(callback);
        },
        tasks: function (callback) {
            Task.find({}).exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }

        // build the job_list, include the count of the number of tasks in each job
        jobData = [];
        for (let i = 0; i < results.jobs.length; i++) {
            jobData.push ({
                name: results.jobs[i].name,
                description: results.jobs[i].description,
                id: results.jobs[i].id,
                nTasks: 0
            });
            for (let j = 0; j < results.tasks.length; j++) {
                if (results.jobs[i].id.toString() == results.tasks[j].job.toString()) {
                    jobData[i].nTasks++;
                }
            }
        }
        res.render(
            '../job/views/job_list', 
            { title: "Job List for Organization '"+ results.organization.name + "'",
             organization: results.organization, 
             job_list: jobData });

    });

};

// Display job create form on GET.
exports.job_create_get = function(req, res, next) {
    Organization.findById(req.params.orgId)
        .exec(function (err, org) {
        if (err) { return next(err);}
        res.render('job_form', { title: 'Create Job for Organzation "' + org.name + '"',
        org: org.id});

    });
};
// Handle job create form on POST. Get the Organization whose key is in url
exports.job_create_post = [

    // validate and sanitize fields
    body('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),

    // save the new job unless there is a job for the organization already
    (req, res, next) => {

        // Extract the validation errors from a request.
        var errors = validationResult(req).array();

        // get the organization that this job is to belong to
        Organization.findById(req.params.orgId).exec(function(err, org) {
            if (err) { return next(err);}

            // check for duplicate job in this orgranization
            Job.findOne({'name': req.body.name, 'organization': req.params.orgId}).exec (function (err, job) {
                if (err) { return next(err)};
                if (job) {
                    errors.push({msg: 'A job with this name already exist for this organization.'});
                }

                // create an job object with escaped and trimmed data
                var newJob = new Job (
                    { name: req.body.name,
                        description: req.body.description,
                        organization: req.params.orgId
                    });
                
                if (errors.length != 0) {
                    res.render('job_form', {
                        title: "Create Job for Organization'" + org.name + "'", 
                        job: newJob,
                        errors: errors });
                } else {
                    
                    // data is valid and sanitized. save it
                    newJob.save(function (err) {
                        if (err) { return next (err);}
                        res.redirect('/jobs/'+req.params.orgId);
                    });
                }
            });
        }
     );
}
];

// Display job modify form on GET.
exports.job_modify_get = function(req, res, next) {
    async.parallel(
        {
            job: function(callback) {
                Job.findById(req.params.id).populate('organization').exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            res.render('job_form', { 
                title: "Modify job '" + results.job.name + "' for organization '" + results.job.organization.name + "'", 
                job: results.job, org: results.job.organization});
        }
    );

};

exports.job_modify_post = [
    // validate and sanitze fields.
    body('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        var errors = validationResult(req).array();

        // reload the job record to retrieve the organization
        Job.findById(req.params.id).populate('organization').exec(function(err, job) {
            if (err) { return next(err); }
            // check if there is another job with this name is the organization
            Job.findOne({'name': req.body.name, 'organization': job.organization})
                .exec (function (err, anotherJob) {
                if (err) {return next(err);}
                if (anotherJob && anotherJob.id != job.id) {
                    errors.push ({msg:'Another job with this name exists in the organization'});
                }

                // create a new job record
                var newJob = new Job (
                    { name: req.body.name,
                        description: req.body.description,
                        organization: job.organization.id,
                        _id:req.params.id
                    });
        
                if (errors.length != 0) {
                    res.render('job_form', {
                        title: "Modify job '" + job.name + "' for organization '" + job.organization.name + "'", 
                        job:newJob,
                        errors: errors });
                } else {
                    // data is valid. update the record
                    Job.findByIdAndUpdate(req.params.id, newJob, {}, function (err) {
                        if (err) { return next(err); }
                        res.redirect ('/jobs/'+newJob.organization._id);

                    });
                }
            });
        });
    }
]


// Handle job delete on GET.
exports.job_delete_get = function(req, res, next) {

    async.parallel({
        job: function(callback) {
            Job.findById(req.params.id).exec(callback)},
        task_count: function(callback) {
            Task.countDocuments({'job': req.params.id}, callback);},
    }, function(err, results) {
        if (err) { return next(err); }

        Job.findByIdAndRemove(results.job.id, function deletejob(err) {
            if (err) { return next(err); }
            // Success - go to organization list
            res.redirect ('/jobs/'+results.job.organization);
        });
    });
};

