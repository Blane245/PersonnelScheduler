var Organization = require('../../models/organization');
var Job = require('../../models/job');
const { body, validationResult } = require('express-validator');
var async = require('async');
const organization = require('../../models/organization');
const job = require('../../models/job');

// the list of jobs for an organization
exports.organization_job_list = function (req, res, next) {
    async.parallel ({
        // get the organization object for this group of jobs
        organization: function (callback) {
            Organization.findById(req.params.orgid).exec(callback);},
        // get the jobs for this organization
        jobs: function (callback) {
            Job.find({ 'organization': req.params.orgid })
            .populate('organization')
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        orgName = results.organization.name;
        res.render(
            '../job/views/job_list', 
            { title: "Job List for Organization '"+ orgName + "'",
             organization: results.organization, 
             job_list: results.jobs });

    });

};

// Display job create form on GET.
exports.job_create_get = function(req, res, next) {
    Organization.findById(req.params.orgId)
        .exec(function (err, org) {
        if (err) { return next(err);}
        res.render('job_form', { title: 'Create Job for Organzation "' + org.name + '"'});

    });
};
// Handle job create form on POST. Get the Organization whose key is in url
exports.job_create_post = [

    // validate and sanitize fields
    body('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),
    // body('organization', '').escape(),
    // prevent a new job from having the same name as a current one

    // save the new job
    (req, res, next) => {

        // get the organization that this job is to belong to
        Organization.findById(req.params.orgId).exec(function(err, org) {
            if (err) { return next(err);}
            req.body.orgId = org._id;
            req.body.orgName = org.name;
            req.body.org = org;

            // create an job object with escaped and trimmed data
            var job = new Job (
                { name: req.body.name.trim(),
                    description: req.body.description.trim(),
                    organization: req.body.org
                });

            // Extract the validation errors from a request.
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                console.log('Error while saving job: ' + req.body.name);

                res.render('job_form', {
                    title: "Create Job for Organization'" + req.body.orgName + "'", 
                    name:req.body.name.trim(), 
                    description:req.body.description.trim(),
                    errors: errors.array() });
            } else {
                
                // data is valid and sanitized. save it
                job.save(function (err) {
                    if (err) { return next (err);}
                    res.redirect('/jobs/'+req.body.orgId);
                });
            }
        }
     );
}
];

// Display job modify form on GET.
exports.job_modify_get = function(req, res, next) {
    async.parallel(
        {
            job: function(callback) {
                console.log('looking for job: ' + req.params.id);
                Job.findById(req.params.id).exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            if (results.job==null) {
                var err = new Error('Job not found');
                err.status = 404;
                return next(err);
            }
            res.render('job_form', { 
                title: 'Modify Job', 
                job: results.job});
            req.session.errors = null;
        }
    );

};

exports.job_modify_post = [
    // validate and sanitze fields.
    body('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    body('description', '').trim().escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the job record to retrieve the organization
        Job.findById(req.params.id).exec(function(err, job) {
            if (err) { return next(err); }
            if (job==null) {
                var err = new Error('Job not found');
                err.status = 404;
                return next(err);
            }
            var org = job.organization;
            var newJob = new Job (
                { name: req.body.name.trim(),
                    description: req.body.description.trim(),
                    organization: org,
                    _id:req.params.id
                });
        
            if (!errors.isEmpty()) {
                res.render('job_form', {
                    title: 'Modify Job', 
                    job:newJob,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Job.findByIdAndUpdate(req.params.id, newJob, {}, function (err) {
                    if (err) { return next(err); }
                    res.redirect ('/jobs/'+newJob.organization);

                });
            }
        });
        
 

    }


]

// Display job delete form on GET.
// TODO prevent deletion when job has related tasks
exports.job_delete_get = function(req, res, next) {

    async.parallel({
        job: function(callback) {
            Job.findById(req.params.id).populate('organization').exec(callback)
        },
        // organizations_books: function(callback) {
        //   Book.find({ 'organization': req.params.id }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.job==null) { // No results.
            res.redirect('/organizations');
        }
        req.body.org = results.job.organization;
        // Successful, so render.
        res.render('job_delete', { 
            title: "Delete job '" + results.job.name + "' from organization '" + results.job.organization.name + "'",
            job: results.job } );
    });

};

// Handle job delete on POST.
exports.job_delete_post = function(req, res, next) {

    async.parallel({
        job: function(callback) {
          Job.findById(req.params.id).exec(callback)
        },
        // organizations_books: function(callback) {
        //   Book.find({ 'organization': req.body.organizationid }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
            // job has no children. Delete object and redirect to the list of jobs for its organization.
            Job.findByIdAndRemove(results.job.id, function deletejob(err) {
                if (err) { return next(err); }
                // Success - go to organization list
                res.redirect ('/jobs/'+results.job.organization);
            })
        // }
    });
};

