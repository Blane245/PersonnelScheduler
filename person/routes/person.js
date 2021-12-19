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

// TODO add leave processing for a person
module.exports = router;
