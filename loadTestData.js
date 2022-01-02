#! /usr/bin/env node

console.log('This script populates some test data for the PersonelScheduler data');

var async = require('async');
var Organization = require('./models/organization');
var Job = require('./models/job');
var Person = require('./models/person');
var Role = require('./models/role');
var Task = require('./models/task');
var Training = require('./models/training');
var Person_Training = require('./models/person_training');
var Leave = require('./models/leave');
// var dataloader = require('./loadTestDataDetails');
  
const mongoose = require('mongoose');


var organization = []
var person = []
var training = []
var role = []
var job = []
var person_training = []
var task = []
var leave = []

function OrganizationCreate(name, description, cb) {
    detail = { name:name, description:description }
    var record = new Organization(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding organization ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Organization: ' + record);
            organization.push(record);
            cb(null, record);
        }});}

function PersonCreate(lastName, firstName, email, organization, cb) {
    detail = { lastName:lastName, firstName:firstName, email:email, organization:organization }
    var record = new Person(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding organization ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Person: ' + record);
            person.push(record);
            cb(null, record);
    }});}

function TrainingCreate(name, description, cb) {
    detail = { name:name, description:description }
    var record = new Training(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding training ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Training: ' + record);
            training.push(record);
            cb(null, record);
        }});}


function RoleCreate(name, description, organization, trainings, cb) {
    detail = { name:name, description:description, organization:organization, trainings: trainings }
    var record = new Role(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding role ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Role: ' + record);
            role.push(record);
            cb(null, record);
        }});}


function JobCreate(name, description, organization, role, cb) {
    detail = { name:name, description:description, organization:organization, role: role }
    var record = new Job(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding job ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Job: ' + record);
            job.push(record);
            cb(null, record);
        }});}

function Person_TrainingCreate(person, training, expirationDate, cb) {
    detail = { person:person, training:training }
    if (expirationDate != false) detail.expirationDate = expirationDate
    var record = new Person_Training(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding person_training ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Person_Training: ' + record);
            person_training.push(record);
            cb(null, record);
        }});}

function TaskCreate(name, description, startDate, endDate, job, roles, cb) {
    detail = { name:name, description:description, job: job, roles:roles }
    if (startDate != false) detail.startDate = startDate;
    if (endDate != false) detail.endDate = endDate;

    // the persons array must be the same size as the roles array and contains null
    persons = []
    persons.length = roles.length;
    for (let i = 0; i < persons.length; i++) {
        var person = new Person ({});
        persons[i] = person;
    }
    detail.persons = persons;
    var record = new Task(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding task ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Task: ' + record);
            task.push(record);
            cb(null, record);
        }});}

function LeaveCreate(name, startDate, endDate, person, cb) {
    detail = { name:name, person:person }
    if (startDate != false) detail.startDate = startDate;
    if (endDate != false) detail.endDate = endDate;
    var record = new Leave(detail);
    record.save(function (err) {
        if (err) { 
            console.log('Error while adding leave ' + detail + ' error ' + err.msg);
            cb(err, null);
        }
        else {
            console.log('New Leave: ' + record);
            leave.push(record);
            cb(null, record);
        }});}





        function OrganizationLoad(cb) {async.series ([
            function (callback) {OrganizationCreate("organization1", "Organization with 1 job, 4 people, and 4 roles",  callback);},
            function (callback) {OrganizationCreate("organization2", "Organization with 2 jobs, 8 people, and 2 roles",  callback);},
            function (callback) {OrganizationCreate("organization3", "Organization with 3 jobs, 12 people, and 8 roles",  callback);},
            function (callback) {OrganizationCreate("organization4", "Organization with no children",  callback);},
            ],cb);}
        function PersonLoad(cb) {async.series ([
            function (callback) {PersonCreate("lastName1", "firstName1", "email1@here.s1", organization[0],  callback);},
            function (callback) {PersonCreate("lastName2", "firstName2", "email1@here.s2", organization[0],  callback);},
            function (callback) {PersonCreate("lastName3", "firstName3", "email1@here.s3", organization[0],  callback);},
            function (callback) {PersonCreate("lastName4", "firstName4", "email1@here.s4", organization[0],  callback);},
            function (callback) {PersonCreate("lastName5", "firstName5", "email1@here.s5", organization[1],  callback);},
            function (callback) {PersonCreate("lastName6", "firstName6", "email1@here.s6", organization[1],  callback);},
            function (callback) {PersonCreate("lastName7", "firstName7", "email1@here.s7", organization[1],  callback);},
            function (callback) {PersonCreate("lastName8", "firstName8", "email1@here.s8", organization[1],  callback);},
            function (callback) {PersonCreate("lastName9", "firstName9", "email1@here.s9", organization[1],  callback);},
            function (callback) {PersonCreate("lastName10", "firstName10", "email1@here.s10", organization[1],  callback);},
            function (callback) {PersonCreate("lastName11", "firstName11", "email1@here.s11", organization[1],  callback);},
            function (callback) {PersonCreate("lastName12", "firstName12", "email1@here.s12", organization[1],  callback);},
            function (callback) {PersonCreate("lastName13", "firstName13", "email1@here.s13", organization[2],  callback);},
            function (callback) {PersonCreate("lastName14", "firstName14", "email1@here.s14", organization[2],  callback);},
            function (callback) {PersonCreate("lastName15", "firstName15", "email1@here.s15", organization[2],  callback);},
            function (callback) {PersonCreate("lastName16", "firstName16", "email1@here.s16", organization[2],  callback);},
            function (callback) {PersonCreate("lastName17", "firstName17", "email1@here.s17", organization[2],  callback);},
            function (callback) {PersonCreate("lastName18", "firstName18", "email1@here.s18", organization[2],  callback);},
            function (callback) {PersonCreate("lastName19", "firstName19", "email1@here.s19", organization[2],  callback);},
            function (callback) {PersonCreate("lastName20", "firstName20", "email1@here.s20", organization[2],  callback);},
            function (callback) {PersonCreate("lastName21", "firstName21", "email1@here.s21", organization[2],  callback);},
            function (callback) {PersonCreate("lastName22", "firstName22", "email1@here.s22", organization[2],  callback);},
            function (callback) {PersonCreate("lastName23", "firstName23", "email1@here.s23", organization[2],  callback);},
            function (callback) {PersonCreate("lastName24", "firstName24", "email1@here.s24", organization[2],  callback);},
            ],cb);}
        function TrainingLoad(cb) {async.series ([
            function (callback) {TrainingCreate("training1", "training used by roles 1-4",  callback);},
            function (callback) {TrainingCreate("training2", "training used by roles 2-4",  callback);},
            function (callback) {TrainingCreate("training3", "training used by roles 3-4",  callback);},
            function (callback) {TrainingCreate("training4", "training used by role 4",  callback);},
            function (callback) {TrainingCreate("training5", "training used by role6",  callback);},
            function (callback) {TrainingCreate("training6", "training used by roles 5-6",  callback);},
            function (callback) {TrainingCreate("training7", "training used by roles 7-13",  callback);},
            ],cb);}
        function RoleLoad(cb) {async.series ([
            function (callback) {RoleCreate("role1", "role with 1 training requirement", organization[0], [training[0]],  callback);},
            function (callback) {RoleCreate("role2", "role with 2 training requirement", organization[0], [training[0], training[1]],  callback);},
            function (callback) {RoleCreate("role3", "role with 3 training requirement", organization[0], [training[0], training[1], training[2]],  callback);},
            function (callback) {RoleCreate("role4", "role with 4 training requirement", organization[0], [training[0], training[1], training[2], training[3]],  callback);},
            function (callback) {RoleCreate("role5", "role with 1 training requirement", organization[1], [training[4]],  callback);},
            function (callback) {RoleCreate("role6", "role with 2 training requirement", organization[1], [training[4], training[5]],  callback);},
            function (callback) {RoleCreate("role7", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role8", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role9", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role10", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role11", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role12", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role13", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            function (callback) {RoleCreate("role14", "role with 1 training requirement", organization[2], [training[6]],  callback);},
            ],cb);}
        function JobLoad(cb) {async.series ([
            function (callback) {JobCreate("Job1", "job with 4 roles", organization[0], [role[0], role[1], role[2], role[3]],  callback);},
            function (callback) {JobCreate("Job2", "job with 2 roles", organization[1], [role[4], role[5]],  callback);},
            function (callback) {JobCreate("Job3", "job with 2 roles", organization[1], [role[4], role[5]],  callback);},
            function (callback) {JobCreate("Job4", "job with 4 roles", organization[2], [role[6], role[7], role[8], role[9]],  callback);},
            function (callback) {JobCreate("Job5", "job with 4 roles", organization[2], [role[6], role[7], role[8], role[9]],  callback);},
            function (callback) {JobCreate("Job6", "job with 8 roles", organization[2], [role[6], role[7], role[8], role[9], role[10], role[11], role[12], role[13]],  callback);},
            ],cb);}
        function Person_TrainingLoad(cb) {async.series ([
            function (callback) {Person_TrainingCreate(person[0], training[0], false,  callback);},
            function (callback) {Person_TrainingCreate(person[1], training[0], false,  callback);},
            function (callback) {Person_TrainingCreate(person[1], training[1], false,  callback);},
            function (callback) {Person_TrainingCreate(person[2], training[0], false,  callback);},
            function (callback) {Person_TrainingCreate(person[2], training[1], false,  callback);},
            function (callback) {Person_TrainingCreate(person[2], training[2], false,  callback);},
            function (callback) {Person_TrainingCreate(person[3], training[0], false,  callback);},
            function (callback) {Person_TrainingCreate(person[3], training[1], false,  callback);},
            function (callback) {Person_TrainingCreate(person[3], training[2], false,  callback);},
            function (callback) {Person_TrainingCreate(person[3], training[3], false,  callback);},
            ],cb);}
        function TaskLoad(cb) {async.series ([
            function (callback) {TaskCreate("Task1", "Task 1 for job 1", "1/1/2022", "1/1/2022", job[0], [role[0], role[1], role[2], role[3]],  callback);},
            ],cb);}
        function LeaveLoad(cb) {async.series ([
            function (callback) {LeaveCreate("leave1", "1/1/2022", "1/7/2022", person[0],  callback);},
            function (callback) {LeaveCreate("leave2", "1/2/2022", "1/8/2022", person[1],  callback);},
            function (callback) {LeaveCreate("leave3", "1/3/2022", "1/9/2022", person[2],  callback);},
            function (callback) {LeaveCreate("leave4", "1/4/2022", "1/10/2022", person[3],  callback);},
            function (callback) {LeaveCreate("leave5", "1/5/2022", "1/11/2022", person[4],  callback);},
            function (callback) {LeaveCreate("leave6", "1/6/2022", "1/12/2022", person[5],  callback);},
            function (callback) {LeaveCreate("leave7", "1/7/2022", "1/13/2022", person[6],  callback);},
            ],cb);}
                
        
function main () {

    //const url = "mongodb+srv://blane2245:wmozart@cluster0.7vveb.mongodb.net/personnel_scheduler?retryWrites=true&w=majority";
    const url = "mongodb://localhost";
    mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.Promise = global.Promise;
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    console.log('DB is open');
    // remove all records from the db
    async.parallel ([
        function (callback) {Organization.deleteMany({}, callback);},
        function (callback) {Person.deleteMany({}, callback);},
        function (callback) {Training.deleteMany({}, callback);},
        function (callback) {Role.deleteMany({}, callback);},
        function (callback) {Job.deleteMany({}, callback);},
        function (callback) {Person_Training.deleteMany({}, callback);},
        function (callback) {Task.deleteMany({}, callback);},
        function (callback) {Leave.deleteMany({}, callback);}

    ], function (err, results) {
        if (err) {
            console.log('Db DELETE ERROR: '+err);
        } else {
            console.log ('All records removed for the database');
            async.series([
                OrganizationLoad,
                PersonLoad,
                TrainingLoad,
                RoleLoad,
                JobLoad,
                Person_TrainingLoad,
                TaskLoad,
                LeaveLoad
    
            ],
            function (err, results){
                if (err) { 
                    console.log('FINAL ERR: '+err);}
                else {
                    console.log('Data loading complete.');}
                mongoose.connection.close();
            });
        }
    });
}

main();