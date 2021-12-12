console.log('Thi scripts removes any data from teh personnel scheduler database and then adds new data.')
var async = require('async')
var Book = require('./models/organization')

var mongoose = require('mongoose');
const organization = require('./models/organization');
const url = "mongodb://localhost"
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var orgs = []

function orgCreate(name, description, cb) {
    orgdetail = { name: name, description: description }

    var org = new organization(orgdetail);

    org.save(function (err) {
        if (err) {
            cb(err, null)
            return
        }
        console.log('New Organization: ' + org);
        orgs.push(org);
        cb(null, org)
    })
}

function createOrganizations(cb) {

    // delete any organizations already in the DB
    console.log('ready to delete all organizations');
    organization.deleteMany({}).then(function(){
        console.log('All organizations deleted.');
    }).catch(function(error){
        console.log(error);
    });

    async.series (
        [
            function(cb) {
                orgCreate('One', 'An organization named One', cb)
            },
            function(cb) {
                orgCreate('Two', 'An organization named Two', cb)
            },
            function(cb) {
                orgCreate('Three', 'An organization named Three', cb)
            },
            function(cb) {
                orgCreate('Four', 'An organization named Four', cb)
            },
            function(cb) {
                orgCreate('Five', 'An organization named Five', cb)
            },
        ],
        cb);
}

async.series([
    createOrganizations
],
function(err, results) {
    if (err) { console.log('FINAL ERR: ' + err);
    } else {
    console.log('personnelscheduler database loaded');
    }
    mongoose.connection.close();
});