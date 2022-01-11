var Job = require('../../models/job');
var Role = require('../../models/role');
const { validationResult, body } = require('express-validator');
var async = require('async');
// Handle roles for a job form on GET.
exports.job_roles_get = function(req, res, next) {
    async.parallel ({
        // get the job object for this group of roles
        job: function (callback) {
            Job.findById(req.params.id).populate('role').exec(callback);},
        
    }, function (err, results) {
        if (err) { return next(err); }
        res.render(
            '../job/views/job_role_list', 
            { title: "Role List for Job '"+ results.job.name + "'",
             orgId: results.job.organization.id,
             job: results.job, 
             roles: results.job.role });

    });
};

// handle the reordering request for roles of a job
exports.job_rolessave_get = function (req, res, next) {

    // update the sequence of roles within a job
    // nothing to validate

    // get the job record to be updated
    Job.findById(req.body.job).exec (function (err, job) {

        // retrieve the updated list of roles from the page
        newRoles = []
        for (let i = 0; i < job.role.length; i++) {
            const parmName = 'r' + i;
            const role = req.body[parmName];
            newRoles.push(role);
        }

        // creata the new Job record with these new roles
        newJob = new Job ({
            name: job.name,
            description: job.description,
            organization: job.organization,
            role: newRoles,
            _id: job.id
        });

        // update the job record
        Job.findByIdAndUpdate(job.id, newJob, {}, function (err) {
            if (err) { return next(err); }
            res.redirect ('/jobs/'+newJob.organization._id);
        });
    });
}

// Display role add to job form on GET.
exports.job_role_add_get = function(req, res, next) {
    // need to make a selection list of all possible roles in an organization
    // that the user can select from 
    // the job is req.param.id and its organization is job.organization.id
    // the list of possible roles are those owned by the organization
    async.parallel(
        {
            job: function(callback) {
                Job.findById(req.params.id).exec(callback);
            },
            roles: function(callback) {
                Role.find({'job': req.params.id}).exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            res.render ('../job/views/job_role_add', {
                title: "Select a role to add to Job '"+results.job.name+"'",
                job: results.job,
                roles: results.roles }
                );
        }
    );        
}

// Handle add role to job delete on POST.
exports.job_role_add_post = [
    
    // validate that a role was selected
    body('role', 'Role must not be empty').trim().isLength({ min : 1}).escape(),

    // process the validated request
    (req, res, next) => {

        const errors = validationResult(req);

        // get the job record being updated
        Job.findById(req.params.id).exec(function(err, job) {
            if (err) {return next(err);}

            // create a new job record from the current one
            newjob = new Job ( {
                name: job.name,
                organization: job.organization,
                description: job.description,
                role: job.role, 
                _id: req.params.id});

            // check for errors (no role selected)
            if (errors.isEmpty()) {

                // update the role list with the this role
                newjob.role.push(req.body.role);

                // update the job record with the new role added and display the job's role list
                Job.findByIdAndUpdate (req.params.id, 
                    newjob, {}, 
                    function(err) {
                        if (err) { return next(err); }
                        res.redirect ('/jobs/job/'+req.params.id+'/roles');
                    } 
                );

            } else {
                    // redisplay the add form with the error messages
                    res.render('jobs/job/'+req.params.id+'/role/add', {
                        title: "Select a role to add to Job'"+results.job.name+"'",
                        job: newjob,
                        roles: req.params.roles,
                        errors: errors.array() });

                }
            });
    }
]

// process the role delete from job GET
exports.job_role_delete_get = function(req, res, next) {
    Job.findById(req.params.id).exec(function (err, job) {

        // build a new job record from the current on
        newJob = new Job ({
            name: job.name,
            description: job.description,
            organization: job.organization,
            role: job.role,
            _id: job.id});
        
        // find the role in job's role array that matches that being deleted
        for (var i = 0; i < job.role.length; i++) {
            if (req.params.roleid == job.role[i]) {
                newJob.role.splice(i, 1);
                break;
            }
        }

        // update the job record
        Job.findByIdAndUpdate(req.params.id, newJob, {}, function (err) {
            if (err) { return next(err); }
            res.redirect ('/jobs/job/'+req.params.id+'/roles');
        });


    });
}
