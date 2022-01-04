var Training = require('../../models/training');
var Person_Training = require('../../models/person_training');
const { check, validationResult } = require('express-validator');
var async = require('async');
const training = require('../../models/training');

exports.training_list = function (req, res, next) {
    Training.find({}, 'name description')
        .sort({name: 1})
        .exec(function (err, trainings) {
            if (err) { return next(err); }
            res.render(
                '../views/training_list', 
                { title: 'Training List', trainings: trainings });
        });
};

// Display training create form on GET.
exports.training_create_get = function(req, res, next) {
    res.render('training_form', { title: 'Create Training'});

};
// Handle training create form on POST
exports.training_create_post = [

   
    // validate and sanitize fields
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),
 
    // save the new training
    (req, res, next) => {
        var errors = validationResult(req).array();

        // check for an existing training record with this name
        Training.findOne({'name': req.body.name}).exec (function (err, training) {
            if (err) { return next(err)};
            if (training) {
                errors.push({msg: 'A training with this name already exists.'});
            }
        
            // create an training object with escaped and trimmed data
            var newTraining = new Training (
                { name: req.body.name,
                description: req.body.description});
            
            if (errors.length !=0) {

                res.render('training_form', {
                    title: 'Create Training',
                    training: newTraining,
                    errors: errors }); 
            } else {
                
                // data is valid and sanitized. save it
                newTraining.save(function (err) {
                    if (err) { return next (err);}
                    res.redirect('/trainings');
                });
            }
        });
    }
]

// Display training modify form on GET.
exports.training_modify_get = function(req, res, next) {
    async.parallel(
        {
            training: function(callback) {
                Training.findById(req.params.id).exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            res.render('training_form', { 
                title: "Modify Training '" + results.training.name + "'", 
                training: results.training});    
        }
    );

};

exports.training_modify_post = [
    // validate and sanitze fields.
    check('name', 'Name must not be empty.').trim().isLength({min: 1}).escape(),
    check('description', '').trim().escape(),

    // process request after validation and sanittzation
    (req, res, next) => {

        var errors = validationResult(req).array();

        // reload the training record to get its name
        Training.findById(req.params.id).exec (function(err, training) {

            // check for an existing training record with this name
            Training.findOne({'name': req.body.name}).exec (function (err, otherTraining) {
                if (err) { return next(err)};
                if (otherTraining && otherTraining.id != req.params.id) {
                    errors.push({msg: 'A training with this name already exists.'});
                }
                var newTraining = new Training (
                    { name: req.body.name,
                    description: req.body.description,
                    _id:req.params.id
                    });
                
                if (errors.length !=0) {
                    res.render('training_form', {
                        title: "Modify Training '" + training.name + "'",
                        training: newTraining, 
                        errors: errors });
                } else {
                    // data is valid. update the record
                    Training.findByIdAndUpdate(req.params.id, newTraining, {}, function (err) {
                        if (err) { return next(err); }
                        res.redirect ('/trainings');

                    });
                }

           });
        });
    }
]


// Handle training delete on GET.
exports.training_delete_get = function(req, res, next) {

    async.parallel({
        training: function(callback) {
          Training.findById(req.params.id).exec(callback)},
        person_trainings: function(callback) {
          Person_Training.find({'training': req.params.id}).exec(callback)}
    }, function(err, results) {
        if (err) { return next(err); }
        for (let i = 0; i < results.person_trainings.length; i++ ){
            Person_Training.findByIdAndRemove(results.person_trainings[i].id, function (err) {
                if (err) { return next (err); }
            });
        }
        Training.findByIdAndRemove(req.params.id, function (err) {
            if (err) { return next(err); }
            res.redirect('/trainings')
        })
    });
};

