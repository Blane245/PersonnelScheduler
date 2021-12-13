const { body,validationResult } = require('express-validator');
var async = require('async');

exports.index = function(req, res, next) {
    // display the entry page
    console.log('ready to render index');
    res.render('index', {title: 'Personnel Scheduler'});

}

// exports.index = function(req, res) {

    // async.parallel({
    //     book_count: function(callback) {
    //         Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
    //     },
    //     book_instance_count: function(callback) {
    //         BookInstance.countDocuments({}, callback);
    //     },
    //     book_instance_available_count: function(callback) {
    //         BookInstance.countDocuments({status:'Available'}, callback);
    //     },
    //     author_count: function(callback) {
    //         Author.countDocuments({}, callback);
    //     },
    //     genre_count: function(callback) {
    //         Genre.countDocuments({}, callback);
    //     }
    // }, function(err, results) {
    //     console.log(err);
    //     res.render('index', { title: 'Personnel Scheduler', error: err, data: results });
    // });
// };

