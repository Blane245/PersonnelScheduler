var Person = require('../../models/person');
var Training = require('../../models/training');
var Person_Training = require('../../models/person_training');
const { body, validationResult } = require('express-validator');
var async = require('async');

// display a person's training records
exports.person_training_list = function(req, res, next) {
    async.parallel ({
        // get the person object for this group of person_trainings
        person: function (callback) {
            Person.findById(req.params.id).exec(callback);},
        // get the person_trainings for this person
        person_trainings: function (callback) {
            Person_Training.find({ 'person': req.params.id }).populate('training')
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        personName = results.person.fullName;
        res.render(
            '../person/views/person_training_list', 
            { title: "Training List for '"+ personName + "'",
             person: results.person, 
             person_trainings: results.person_trainings });

    });

};

// Display person's person_training create form on GET.
exports.person_training_create_get = function(req, res, next) {

    // get the person and all of the possble trainings that a person can take
    async.parallel ( {
        person: function (callback) {
            Person.findById(req.params.id).exec(callback);},
        trainings: function (callback) { 
            Training.find({}).exec(callback);},

    },function (err, results) {
        if (err) { return next(err);}
        res.render('person_training_form', 
            { title: "Create training record for '" + results.person.fullName + "'",
            person: results.person, 
            trainings: results.trainings, 
            modify: false   });

    }); 
};

// add training reocrd for a person
exports.person_training_create_post = [
    
    // validate and sanitize fields
    body('training', '').escape(),
    body('expirationDate', 'Training expiration date must be a valid.').optional({ checkFalsy: true }).isISO8601(),

    // save the new person_training record
    (req, res, next) => {

        // Extract the validation errors from the request
        const errors = validationResult (req);

        // create a new person_training record from the vlaidiated and sanitixed data.
        var person_training = new Person_Training ( {
            training: req.body.training,
            expirationDate : req.body.expirationDate,
            person: req.params.id
        });

        // redisplay the form is there are errors
        if (!errors.isEmpty()) {
            Person.findById(req.param.id)
            .exec (function (err, person) {
                if (err) { return next (err); }
                res.render('person_training_form'), { 
                    title: 'Create training record for "' + person.name + '"',
                    person_training: person_training,
                    errors: errors.array()}
                });
        } else {
            
            // data is valid and sanitized. save it and return to person_training list
            person_training.save(function (err) {
                if (err) { 
                    console.log('save error: \n'+err);
                    return next (err);}
                res.redirect('/persons/person/'+req.params.id+'/person_training');
            });
        }
                    
    }


];

// Display person's training modify form on GET.
exports.person_training_modify_get = function(req, res, next) {
    async.parallel({
        person_training: function(callback) {
            Person_Training.findById(req.params.trainingid).populate('training').populate('person').exec(callback);
        },
        trainings: function (callback) {
            Training.find({}).exec(callback);
        },
        } ,function(err, results) {
            if (err) { return next(err); }
            res.render('person_training_form', { 
                title: "Modify training record for '" + results.person_training.person.fullName + "'", 
                person: results.person_training.person,
                person_training: results.person_training,
                trainings: results.trainings,
                modify: true
            });    
        }
    );

}
// Display person's training record modify form on POST.
exports.person_training_modify_post = [
    // validate and sanitize fields.
    body('training', '').escape(),
    body('expirationDate', 'Training expiration date must be a valid.').optional({ checkFalsy: true }).isISO8601(),
 
    // process request after validation and sanittzation
    (req, res, next) => {

        const errors = validationResult(req);

        // reload the person training record
        Person_Training.findById(req.params.trainingid).populate('person').exec(function(err, person_training) {
            if (err) { return next(err); }
            var newPersonTraining = new Person_Training (
                { person: person_training.person,
                  expirationDate: req.body.expirationDate,
                  training: req.body.training,
                  _id: req.params.trainingid
                });
        
            if (!errors.isEmpty()) {
                res.render('person_training_form', {
                    title: "Modify training record for '" + person_training.person.fullName ,
                    person_training: newPersonTraining,
                    person: person_training.person,
                    errors: errors.array() });
            } else {
                // data is valid. update the record
                Person_Training.findByIdAndUpdate(req.params.trainingid, newPersonTraining, {}, function (err) {
                    if (err) { return next(err); }

                    // redirect to the person's training list
                    res.redirect ('/persons/person/'+person_training.person.id+'/person_training');

                });
            }
        });
    }

]


// Display person's leave delete form on POST.
exports.person_training_delete_get = function(req, res, next) {
    Person_Training.findByIdAndRemove(req.params.trainingid, function (err) {
        if (err) { return next(err); }
        res.redirect ('/persons/person/'+req.params.id+'/person_training');
    });
}