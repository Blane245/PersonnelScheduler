var Organization = require('../../models/organization');
var Person = require('../../models/person');
var Job = require('../../models/job');
var async = require('async');
const { DateTime } = require("luxon");
var training_reports = require('./reportTrainingController');
var task_reports = require('./reportTaskController');
var task_calendar_reports = require('./reportTaskCalendar');

// the list of roles for an organization
exports.report_menu = function (req, res, next) {
    async.parallel({
        orgs: function(callback) {
            Organization.find({}).exec(callback)},
        persons: function(callback) {
            Person.find({}).exec(callback)},
        jobs: function(callback) {
            Job.find({}).exec(callback)},
        }, function(err, results) {
        res.render('report_menu', { 
            title: '', 
            orgs: results.orgs,
            persons: results.persons,
            jobs: results.jobs}
        );}
    );      
}

// process the report request
exports.report_menu_post = function (req, res, next) {
    const now = DateTime.local().toFormat('yyyy-MM-dd hh:mm:ss');

    // based on the specific button pushed, build the report 
    if (req.body.training_all != null)
        training_reports.report_training_all (req, res, next, now);
    if (req.body.training_org != null)
        training_reports.report_training_org (req, res, next, now);
    if (req.body.training_person != null)
        training_reports.report_training_person (req, res, next, now);
    if (req.body.task_all != null)
        task_reports.report_task_all (req, res, next, now);
    if (req.body.task_org != null)
        task_reports.report_task_org (req, res, next, now);
    if (req.body.task_job != null)
        task_reports.report_task_job (req, res, next, now);
    if (req.body.task_calendar != null)
        task_calendar_reports.report_task_calendar (req, res, next, now);
    
    // fall thru - re-render the menu
}

