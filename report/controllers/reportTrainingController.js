var Organization = require('../../models/organization');
var Person = require('../../models/person');
var Person_Training = require('../../models/person_training');
exports.report_training_all = function (req,res,next, now) {

    // get all of the persons in teh database
    Person.find({}).sort('fullName').populate('organization').exec(function (err, persons) {
        if (err) { return next(err);}

        // get all of the personnel training records for all persons
        Person_Training.find({}).populate('training').sort('expirationDate').exec(function(err, person_trainings) {
            if (err) { return next (err);}

            // the report goes by each person and then their traininf records
            var report_data = [];
            for (let i = 0; i < persons.length; i++) {
                report_data.push({
                    person: persons[i],
                    training_data: []
                });
                var this_set = [];
                for (let j = 0; j < person_trainings.length; j++) {

                    // match the person to this training record
                    if (persons[i]._id.toString() == person_trainings[j].person.toString())
                        report_data[i].training_data.push({
                            training: person_trainings[j].training,
                            expirationDate: person_trainings[j].expirationDate_formatted});
                }
            }

            // render the report
            res.render('report_training_records', { 
                title: 'Training Record for all Personnel', 
                dateTime: now,
                report_data: report_data,
            });
        });
    });

}

exports.report_training_org = function (req,res,next,now) {

    Organization.findById(req.body.org).exec(function(err, org) {
        if (err) { return next(err);}
        // get all of the persons for the organization database
        Person.find({'organization': org.id}).sort('fullName').populate('organization').exec(function (err, persons) {
            if (err) { return next(err);}

            // get all of the personnel training records for all persons
            Person_Training.find({}).populate('training').sort('expirationDate').exec(function(err, person_trainings) {
                if (err) { return next (err);}

                // the report goes by each person and then their training records
                var report_data = [];
                for (let i = 0; i < persons.length; i++) {
                    report_data.push({
                        person: persons[i],
                        training_data: []
                    });
                    var this_set = [];
                    for (let j = 0; j < person_trainings.length; j++) {

                        // match the person to this training record
                        if (persons[i]._id.toString() == person_trainings[j].person.toString())
                            report_data[i].training_data.push({
                                training: person_trainings[j].training,
                                expirationDate: person_trainings[j].expirationDate_formatted});
                    }
                }

                // render the report 
                var title = (persons.length == 0)?
                    "There are no Personnel in Organization '"+org.name+'"':
                    "Training Records for all Personnel in Organization '"+org.name+"'";
                res.render('report_training_records', { 
                    title: title, 
                    dateTime: now,
                    report_data: report_data,
                });
            });
        });

    });
}

exports.report_training_person = function (req,res,next,now) {
    // get the requested person
    Person.findById(req.body.person).exec(function (err, person) {
        if (err) { return next(err);}

        // get all of the personnel training records for this person
        Person_Training.find({'person':person.id}).populate('training').sort('expirationDate').exec(function(err, person_trainings) {
            if (err) { return next (err);}

            var report_data = [];
            report_data.push({
                person: person,
                training_data: []
            });
            for (let j = 0; j < person_trainings.length; j++) {

                report_data[0].training_data.push({
                    training: person_trainings[j].training,
                    expirationDate: person_trainings[j].expirationDate_formatted});
            }

            // render the report
            res.render('report_training_records', { 
                title: "Training Record for '"+person.fullName+" ("+person.email+")'", 
                dateTime: now,
                report_data: report_data,
            });
        });
    });

}

