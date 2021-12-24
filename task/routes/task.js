var express = require('express');
var router = express.Router();

var task_controller = require('../controllers/taskController');

/* GET request for creating a task for job */
router.get('/job/:id/create', task_controller.task_create_get);

/* POST request for creating a task for job */
// this handles both the Save and Assign buttons
router.post('/job/:id/create', task_controller.task_create_post);

/* GET request for modifying a task for job */
router.get('/job/:id/task/:taskid/modify', task_controller.task_modify_get);

/* POST request for modifying a task for job */
// this handles both the Save and Assign buttons
router.post('/job/:id/task/:taskid/modify', task_controller.task_modify_post);

/* GET request for making assignments to a task */
router.get('/job/:id/task/:taskid/assign', task_controller.task_assign_get);

/* GET request for making assignments to a task */
router.post('/job/:id/task/:taskid/assign', task_controller.task_assign_post);

/* GET request for deleting a job's task */
router.get('/job/:id/task/:taskid/delete', task_controller.task_delete_get);

/* POST request for deleting a job's task */
router.post('/job/:id/task/:taskid/delete', task_controller.task_delete_post);

module.exports = router;
