var express = require('express');
var router = express.Router();

var job_controller = require('../controllers/jobController');
var job_role_controller = require('../controllers/jobroleController');
var task_controller = require('../../task/controllers/taskController');

/* GET request for list of jobs in an organization */
router.get('/:orgId', job_controller.organization_job_list);

/* GET request for creating a job for an organization */
router.get('/:orgId/create', job_controller.job_create_get);

/* Post request for creating a job for an organization */
router.post('/:orgId/create', job_controller.job_create_post);

/* GET request for modifying a job */
router.get('/job/:id/modify', job_controller.job_modify_get);

/* Post request for modifying a job*/
router.post('/job/:id/modify', job_controller.job_modify_post);

/* GET request for deleting a job */
router.post('/job/:id/delete', job_controller.job_delete_post);

/* GET request for editing roles for a job */
router.get('/job/:id/roles', job_role_controller.job_roles_get);

/* PUT request for reordering roles for a job */
router.post('/job/:id/roles', job_role_controller.job_rolessave_get);

/* GET request for adding a role to a job */
router.get('/job/:id/role/add', job_role_controller.job_role_add_get);

/* Post request for adding a role to a job */
router.post('/job/:id/role/add', job_role_controller.job_role_add_post);

/* GET request for deleting a role from a job */
router.get('/job/:id/role/:roleid/delete', job_role_controller.job_role_delete_get);

/* GET request for editing tasks for a job */
router.get('/job/:id/tasks', task_controller.task_list_get);

module.exports = router;
