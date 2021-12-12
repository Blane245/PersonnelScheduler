var Organization = ('/models/organization');
const { body, validationResult } = require('express-validator');
var asyn = require('async');

exports.organization_list = function (req, res, next) {
    console.log('in organization_list controller');
    Organization.find({}, 'name description')
        .sort({name: 1})
        .exec(function (err, list_organizations) {
            if (err) { return next(err); }
            res.render(
                'organization_list', 
                { title: 'Organization List', organization_list: list_organizations });
        } , function(err, results) {
            console.log(err);
            res.render('organization_list', { title: 'Organization List', error: err, data: results }
            );
        });
};