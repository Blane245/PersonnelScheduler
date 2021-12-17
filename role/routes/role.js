var express = require('express');
var router = express.Router();

var role_controller = require('../controllers/roleController');

/* GET request for list of roles in an organization */
router.get('/:orgid', role_controller.organization_role_list);

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

/* Post request for deleting a role */
router.post('/role/:id/delete', role_controller.role_delete_post);

module.exports = router;
