var Training = require('../../models/training');
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
                { title: 'Training List', training_list: trainings });
        } , function(err, results) {
            res.render('../views/training_list', { title: 'Training List', error: err, data: results }
            );
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
    // TODO prevent a new training from having the same name as a current one
 
    // save the new training
    (req, res, next) => {
        const errors = validationResult(req);

        // creat an training object with escaped and trimmed data
        var training = new Training (
            { name: req.body.name.trim(),
              description: req.body.description.trim()});
        
        if (!errors.isEmpty()) {

            res.render('training_form', {
                title: 'Create Training', 
                name:req.body.name.trim(), 
                description:req.body.description.trim(),
                errors: errors.array() });
        } else {
            
            // data is valid and sanitized. save it
            training.save(function (err) {
                if (err) { return next (err);}
                res.redirect('/trainings');
            });
        }
    }
];

// Display training modify form on GET.
exports.training_modify_get = function(req, res, next) {
    async.parallel(
        {
            training: function(callback) {
                console.log('looking for training: ' + req.params.id);
                Training.findById(req.params.id).exec(callback);
            },
        }, 
        function(err, results) {
            if (err) { return next(err); }
            if (results.training==null) {
                var err = new Error('Training not found');
                err.status = 404;
                return next(err);
            }
            res.render('training_form', { 
                title: 'Modify Training', 
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

        const errors = validationResult(req);
        var training = new Training (
            { name: req.body.name.trim(),
              description: req.body.description.trim(),
              _id:req.params.id
            });
        
        if (!errors.isEmpty()) {
            res.render('training_form', {
                title: 'Modify Training', 
                name:req.body.name.trim(), 
                description:req.body.description.trim(),
                errors: errors.array() });
        } else {
            // data is valid. update the record
            Training.findByIdAndUpdate(req.params.id, training, {}, function (err) {
                if (err) { return next(err); }
                res.redirect ('/trainings');

            });
        }
        
 

    }


]

// Display training delete form on GET.
exports.training_delete_get = function(req, res, next) {

    async.parallel({
        training: function(callback) {
            Training.findById(req.params.id).exec(callback)
        },
        // trainings_books: function(callback) {
        //   Book.find({ 'training': req.params.id }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.training==null) { // No results.
            res.redirect('/catalog/trainings');
        }
        // Successful, so render.
        res.render('training_delete', { title: 'Delete training (without children checking', training: results.training } );
    });

};

// Handle training delete on POST.
exports.training_delete_post = function(req, res, next) {

    async.parallel({
        training: function(callback) {
          Training.findById(req.body.trainingid).exec(callback)
        },
        // trainings_books: function(callback) {
        //   Book.find({ 'training': req.body.trainingid }).exec(callback)
        // },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        // if (results.trainings_books.length > 0) {
        //     // training has books. Render in same way as for GET route.
        //     res.render('training_delete', { title: 'Delete training (delete children first)', training: results.training, training_books: results.trainings_books } );
        //     return;
        // }
        // else {
            // training has no children. Delete object and redirect to the list of trainings.
            Training.findByIdAndRemove(req.body.trainingid, function deletetraining(err) {
                if (err) { return next(err); }
                // Success - go to training list
                res.redirect('/trainings')
            })
        // }
    });
};

