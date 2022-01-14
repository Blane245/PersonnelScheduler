const Organization = require('../../models/organization');
const Job = require('../../models/job');
const Task = require('../../models/task');
const { body, validationResult } = require('express-validator');

// the list of jobs for an organization
exports.organization_job_list = async function (req, res, next) {

    // get the organization object for this group of jobs
    let organization = null;
    try {
        organization = await Organization.findById(req.params.orgId);
    } catch (error) {
        if (error) return(next(error));
    }

    // get the jobs for this organization
    let jobs = null;
    try {
        jobs = await Job.find({ 'organization': req.params.orgId }).populate('organization');
    } catch (error) {
        if (error) return(next(error));
    }

    // get all of the tasks for all of the jobs
    let tasks = null;
    try {
        tasks = await Task.find({'job': {$in: jobs}});
    } catch (error) {
        if (err) { return next(err); }
    }       

    // build the job_list, include the count of the number of tasks in each job
    jobData = [];
    for (let job of jobs) {
        jobData.push ({
            name: job.name,
            description: job.description,
            id: job.id,
            nTasks: 0
        });
        for (let j = 0; j < tasks.length; j++) {
            if (job.id.toString() == tasks[j].job.toString()) {
                jobData[jobData.length-1].nTasks++;
            }
        }
    }
    res.render(
        '../job/views/job_list', 
        { title: "Job List for Organization '"+ organization.name + "'",
            organization: organization, 
            job_list: jobData });
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
    async (req, res, next) => {

        // Extract the validation errors from a request.
        var errors = validationResult(req).array();

        // get the organization that this job is to belong to
        let org = null;
        try {
            org = await Organization.findById(req.params.orgId);
        } catch (error) {
            if (error) return(next(error));
        }

        // check for duplicate job in this orgranization
        let job = null;
        try {
            job = await Job.findOne({'name': req.body.name, 'organization': req.params.orgId});
        } catch (error) {
            if (error) return(next(error));
        }
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
    }
];

// Display job modify form on GET.
exports.job_modify_get = async function(req, res, next) {

    let job = null;
    try {
        job = await Job.findById(req.params.id).populate('organization');
    } catch (error) {
        if (error) return(next(error));
    }
    res.render('job_form', { 
        title: "Modify job '" + job.name + "' for organization '" + job.organization.name + "'", 
        job: job, 
        org: job.organization});
};

exports.job_modify_post = [
    // validate and sanitze fields.
    body('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),

    // process request after validation and sanittzation
    async (req, res, next) => {

        var errors = validationResult(req).array();

        // reload the job record to retrieve the organization
        let job = null;
        try {
            job = await Job.findById(req.params.id).populate('organization');
        } catch (error) {
            if (error) return(next(error));
        }

        // check if there is another job with this name is the organization
        let anotherJob = null;
        try {
            anotherJob = await Job.findOne({'name': req.body.name, 'organization': job.organization});
        } catch (error) {
            if (error) return(next(error));
        }
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
                org: job.organization,
                errors: errors });
        } else {

            // data is valid. update the record
            Job.findByIdAndUpdate(req.params.id, newJob, {}, function (err) {
                if (err) { return next(err); }
                res.redirect ('/jobs/'+newJob.organization);

            });
        }
    }
]


// Handle job delete on GET.
exports.job_delete_post = function(req, res, next) {

    Job.findByIdAndRemove(req.params.id, function deletejob(err) {
        if (err) { return next(err); }
        // Success - go to organization list
        res.redirect ('/jobs/'+results.job.organization);
    });
};

