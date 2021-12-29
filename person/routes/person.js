var express = require('express');
var router = express.Router();
var person_controller = require('../controllers/personController');

/* GET request for list of persons in an organization */
router.get('/:orgid', person_controller.organization_person_list);

/* GET request for creating a person for an organization */
router.get('/:orgId/create', person_controller.person_create_get);

/* Post request for creating a person for an organization */
router.post('/:orgId/create', person_controller.person_create_post);

/* GET request for modifying a person */
router.get('/person/:id/modify', person_controller.person_modify_get);

/* Post request for modifying a person*/
router.post('/person/:id/modify', person_controller.person_modify_post);

/* GET request for deleting a person */
router.get('/person/:id/delete', person_controller.person_delete_get);

/* Post request for deleting a person */
router.post('/person/:id/delete', person_controller.person_delete_post);

/* GET request for handling a person's leave */
router.get('/person/:id/leave', person_controller.person_leave_list);

/* GET request for adding leave */
router.get('/person/:id/leave/create', person_controller.person_leave_create_get);

/* POST request for adding leave */
router.post('/person/:id/leave/create', person_controller.person_leave_create_post);

/* GET request for modifying leave */
router.get('/person/:id/leave/:leaveid/modify', person_controller.person_leave_modify_get);

/* POST request for modfying leave */
router.post('/person/:id/leave/:leaveid/modify', person_controller.person_leave_modify_post);

/* GET request for deleting person's leave */
router.get('/person/:id/leave/:leaveid/delete', person_controller.person_leave_delete_get);

/* POST request for deleting a person's leave */
router.post('/person/:id/leave/:leaveid/delete', person_controller.person_leave_delete_post);

/* GET request for handling a person's leave */
router.get('/person/:id/person_training', person_controller.person_training_list);

/* GET request for adding person_training */
router.get('/person/:id/person_training/create', person_controller.person_training_create_get);

/* POST request for adding person_training */
router.post('/person/:id/person_training/create', person_controller.person_training_create_post);

/* GET request for modifying person_training */
router.get('/person/:id/person_training/:trainingid/modify', person_controller.person_training_modify_get);

/* POST request for modfying person_training */
router.post('/person/:id/person_training/:trainingid/modify', person_controller.person_training_modify_post);

/* GET request for deleting person's person_training */
router.get('/person/:id/person_training/:trainingid/delete', person_controller.person_training_delete_get);

/* POST request for deleting a person's person_training */
router.post('/person/:id/person_training/:trainingid/delete', person_controller.person_training_delete_post);

module.exports = router;
