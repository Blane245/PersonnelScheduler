var Role = require('../../models/role');
const Training = require('../../models/training');
const { validationResult } = require('express-validator');
var async = require('async');

// the list of training requirments for role
exports.role_training_list = async function (req, res, next) {

    // get the role that contains the training list
    let role = null;
    try {
        role = await Role.findById(req.params.id).populate('trainings');
    } catch (error) {
        if (error) return(next(error));
    }
    roleName = role.name;

    // display the training requirements list
    res.render(
        '../role/views/role_training_list', 
        { title: "Training requirements for role '"+ roleName + "'",
            role: role, 
            trainings: role.trainings });
};

// Display role's training requirements create form on GET.
exports.role_training_create_get = async function(req, res, next) {

    // get the role that contains the training list
    let role = null;
    try {
        role = await Role.findById(req.params.id).populate('trainings');
    } catch (error) {
        if (error) return(next(error));
    }

    // get all of the training records that could apply
    let trainings = null;
    try {
        trainings = await Training.find({});
    } catch (error) {
        if (error) return(next(error));
    }

    // show the training creation form
    res.render('role_training_form', 
        { title: "Add a training requirement for role '" + role.name + "'",
        role: role, 
        trainings: trainings, 
        modify: false});

};

// add a training requirement to a role POST
exports.role_training_create_post = async function (req, res, next) {

    // load the current role record so it's training array can be updated
    let role = null;
    try {
        role = await Role.findById(req.params.id);
    } catch (error) {
        if (error) return(next(error));
    }

    var errors = validationResult(req).array();

    // make sure that the training is not already active for this role
    for (let i = 0; i < role.trainings.length; i++) {
        if (req.body.training == role.trainings[i]) {
            errors.push({msg: 'A training reord for this role is already required by this role'});
            break;
        }

    }

    // add the new training requirement to the existing training list
    role.trainings.push(req.body.training);

    // create a new role record from the validiated and sanitized data.
    var newRole = new Role ( {
        trainings: role.trainings,
        organization: role.organization,
        name: role.name,
        description: role.description,
        _id: req.params.id
    });

    // redisplay create page when a duplicate exists
    if (errors.length != 0) {
        res.render('role_training_form', 
            { title: "Add a training requirement for role '" + role.name + "'",
            role: role, 
            trainings: role.trainings, 
            errors: errors,
            modify: false});

    }
    
    // update the record and return to role training list
    Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
        if (err) { return next(err); }
        res.redirect ('/roles/role/'+req.params.id+'/training');

    });
}

// Display person's training modify form on GET.
exports.role_training_modify_get = async function(req, res, next) {

    // get the role that contains the training list
    let role = null;
    try {
        role = await Role.findById(req.params.id).populate('trainings');
    } catch (error) {
        if (error) return(next(error));
    }

    // get all of the training records that could apply
    let trainings = null;
    try {
        trainings = await Training.find({});
    } catch (error) {
        if (error) return(next(error));
    }

    // show the modify form
    res.render('role_training_form', { 
        title: "Modify training requirements for role '" + role.name + "'", 
        role: role, 
        trainings: trainings, 
        trainingid: req.params.trainingid,
        modify: true}
    );
}
// Display role training requirement modify form on POST.
exports.role_training_modify_post = async function (req, res, next) {

    // get the role that contains the training list
    let role = null;
    try {
        role = await Role.findById(req.params.id).populate('trainings');
    } catch (error) {
        if (error) return(next(error));
    }

    // get all of the training records that could apply
    let trainings = null;
    try {
        trainings = await Training.find({});
    } catch (error) {
        if (error) return(next(error));
    }

    // create a new role record from the validiated and sanitized data.
    var newRole = new Role ( {
        trainings: role.trainings,
        organization: role.organization,
        name: role.name,
        description: role.description,
        _id: req.params.id
    });

    // replace the current training requirement with the new one
    for (i in role.trainings) {
        if (newRole.trainings[i].id == req.params.trainingid) {
            newRole.trainings[i] = req.body.training;
            break;
        }
    }
    let errors = validationResult(req).array();

    // check that the modified training entry isn't already there
    for (i in newRole.trainings) {
        for (let j = i+1; j < newRole.trainings.length; j++) {
            if (newRole.trainings[i] == newRole.trainings[j]) {
                errors.push({msg: 'This training requirement already exists for the role'})
                break;
            }
        }
    }

    // redisplay modify page when a duplicate exists
    if (errors.length != 0) {
        res.render('role_training_form', 
            { title: "Add a training requirement for role '" + role.name + "'",
            role: role, 
            trainings: trainings, 
            errors: errors,
            modify: true});
    }

    // update the record and return to role training list
    Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
        if (err) { return next(err); }
        res.redirect ('/roles/role/'+req.params.id+'/training');

    });
                   
}

// Handle role delete on GET.
exports.role_training_delete_get = async function(req, res, next) {

    // get the role that contains the training list
    let role = null;
    try {
        role = await Role.findById(req.params.id).populate('trainings');
    } catch (error) {
        if (error) return(next(error));
    }
    
    // create a new role record so the selected training requirement can be deleted from the array
    var newRole = new Role ( {
        trainings: role.trainings,
        organization: role.organization,
        name: role.name,
        description: role.description,
        _id: req.params.id
    });

    // remove the current training requirement with the new role record
    for (i in newRole.trainings) {
        if (newRole.trainings[i]._id.toString() == req.params.trainingid.toString()) {
            newRole.trainings.splice(i, 1);
            break;
        }
    }
    
    // update the record and return to role training list
    Role.findByIdAndUpdate(req.params.id, newRole, {}, function (err) {
        if (err) { return next(err); }
        res.redirect ('/roles/role/'+req.params.id+'/training');

    });
}
