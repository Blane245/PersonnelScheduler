var async = require('async');
var Organization = require('../models/organization');
var Job = require('../models/job');
var Person = require('../models/person');
var Role = require('../models/role');
var Task = require('../models/task');
var Training = require('../models/training');
var Leave = require('../models/leave');

exports.index = function(req, res, next) {
    async.parallel({
        organization_count: function(callback) {
            Organization.countDocuments({}, callback);
        },
        
        job_count: function(callback) {
            Job.countDocuments({}, callback);
        },
        
        person_count: function(callback) {
            Person.countDocuments({}, callback);
        },
        
        role_count: function(callback) {
            Role.countDocuments({}, callback);
        },
        
        task_count: function(callback) {
            Task.countDocuments({}, callback);
        },
        
        leave_count: function(callback) {
            Leave.countDocuments({}, callback);
        },
        
        training_count: function(callback) {
            Training.countDocuments({}, callback);
        },
        
    }, function (err, results){
        res.render('index', {results: results });

    });
}
