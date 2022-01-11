var Organization = require('../../models/organization');
var Person = require('../../models/person');
var Person_Training = require('../../models/person_training');
exports.report_training_all = async function (req,res,next, now) {

    let persons;
    try {
        persons = await Person.find({}).sort('fullName').populate('organization');
    } catch (err) {
        return next(err);
    }

    let person_trainings;
    try {
        person_trainings = await Person_Training.find({}).populate('training').sort('expirationDate');
    } catch (err) {
        return next(err);
    }
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
    res.render('report_training_records', { 
        title: 'Training Record for all Personnel', 
        dateTime: now,
        report_data: report_data,
    });

}

exports.report_training_org = async function (req,res,next,now) {

    let org;
    try {
        org = await Organization.findById(req.body.org);
    } catch (err) {
        return next(err);
    }

    let persons;
    try {
        persons = await Person.find({'organization': org.id}).sort('fullName').populate('organization');
    } catch (err) {
        return next(err);
    }

    let person_trainings;
    try {
        person_trainings = await Person_Training.find({}).populate('training').sort('expirationDate');
    } catch (err) {
        return next(err);
    }


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
}

exports.report_training_person = async function (req,res,next,now) {
    let person;
    try {
        person = await Person.findById(req.body.person);
    } catch (err) {
        return (next (err));
    }
    let person_trainings;
    try {
        person_trainings = await Person_Training.find({'person':person.id}).populate('training').sort('expirationDate')
    } catch (err) {
        return (next (err));
    }

    let report_data = [];
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

}

