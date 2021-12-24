// TODO prevent changes to a role list for a job if there are already tasks for the job
var Job = require('../../models/job');
var Role = require('../../models/role');
const { validationResult, body } = require('express-validator');
var async = require('async');
const organization = require('../../models/organization');
// Handle roles for a job form on GET.
exports.job_roles_get = function(req, res, next) {
    async.parallel ({
        // get the job object for this group of roles
        job: function (callback) {
            Job.findById(req.params.id).exec(callback);},
    }, function (err, results) {
        if (err) { return next(err); }
        res.render(
            '../job/views/job_role_list', 
            { title: "Role List for Job '"+ results.job.name + "'",
             orgId: results.job.organization.id,
             job: results.job, 
             role_list: job.role });

    });
};

// Display role add to job form on GET.
exports.job_role_add_get = function(req, res, next) {
    // need to make a selection list of all possible roles in an organization
    // that the user can select from 
    // the job is req.param.id and its organization is job.organization.id
    // the list of possible roles are those owned by the organization
    
    // get the job so the org known
    Job.findById(req.params.id).populate('organization')
    .exec(function (err, job){
        if (err) { return next(err);}

        // now get the list of roles for this organization
        Role.find({ 'organization': job.organization })
        .exec(function (err, roles) {
            if (err) { return next(err);}

            // render the add role to job form with the role drop down list
            res.render ('../job/views/job_role_add', {
                title: 'Select a role to add to the job',
                job: job,
                roles: roles }
                );
        });
    });
        
}

// Handle add role to job delete on POST.
exports.job_role_add_post = [
    
    // validate that a role was selected
    body('role', 'Role must not be empty').trim().isLength({ min : 1}).escape,

    // process the validated request
    (req, res, next) => {

        const errors = validationResult(req);
        // check for errors (no role selected)
        if (errors.isEmpty()) {
 
            // locate the role record selected
            Role.findById(req.params.role)
            .exec(function (err, role) {
                if (err) { return next(err);}

                // update the role list with the this role
                var roles = job.role;
                roles = roles.push(req.body.role);

                // locate the job record so it can be modifid
                Job.findById (req.params.id)
                .exec (function (err, job) {

                    // create a new job record from the current one
                    // the the role array updated
                    newjob = new Job ( {
                        name: job.name,
                        organization: job.organization,
                        description: job.description,
                        role: roles, 
                        _id: req.params.id});

                    });

                    // update the job record with the new role added and display the job's role list
                    Job.findByIdAndUpdate (req.params.id, 
                        newjob, {}, 
                        function(err, thejob) {
                            if (err) { return next(err); }
                            res.redirect ('job/'+req.params.id+'/roles');
                        } 
                    );

                });

           } else {

                // redisplay the add form with the error messages
                res.render('/job/'+req.params.id+'/role/add', {
                    title: 'Select a role to add to the job', 
                    job: job,
                    roles: req.params.roles,
                    errors: errors.array() });

            }
        }
]
