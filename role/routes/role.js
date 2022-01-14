var express = require('express');
var router = express.Router();

var role_controller = require('../controllers/roleController');
var role_training_controller = require('../controllers/roleTrainingController');

/* GET request for list of roles in an organization */
router.get('/:orgId', role_controller.organization_role_list);

/* GET request for creating a role for an organization */
router.get('/:orgId/create', role_controller.role_create_get);

/* Post request for creating a role for an organization */
router.post('/:orgId/create', role_controller.role_create_post);

/* GET request for modifying a role */
router.get('/role/:id/modify', role_controller.role_modify_get);

/* Post request for modifying a role*/
router.post('/role/:id/modify', role_controller.role_modify_post);

/* GET request for deleting a role */
router.get('/role/:id/delete', role_controller.role_delete_get);

/* GET request for list of roles in an organization */
router.get('/role/:id/training', role_training_controller.role_training_list);

/* GET request for creating a role for an organization */
router.get('/role/:id/training/create', role_training_controller.role_training_create_get);

/* Post request for creating a role for an organization */
router.post('/role/:id/training/create', role_training_controller.role_training_create_post);

/* GET request for modifying a role training*/
router.get('/role/:id/training/:trainingid/modify', role_training_controller.role_training_modify_get);

/* Post request for modifying a role training*/
router.post('/role/:id/training/:trainingid/modify', role_training_controller.role_training_modify_post);

/* GET request for deleting a role training */
router.get('/role/:id/training/:trainingid/delete', role_training_controller.role_training_delete_get);

module.exports = router;
