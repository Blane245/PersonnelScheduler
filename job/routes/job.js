var express = require('express');
var router = express.Router();

var job_controller = require('../controllers/jobController');

/* GET request for list of jobs in an organization */
router.get('/:orgid', job_controller.organization_job_list);

/* GET request for creating a job for an organization */
router.get('/:orgId/create', job_controller.job_create_get);

/* Post request for creating a job for an organization */
router.post('/:orgId/create', job_controller.job_create_post);

/* GET request for modifying a job */
router.get('/job/:id/modify', job_controller.job_modify_get);

/* Post request for modifying a job*/
router.post('/job/:id/modify', job_controller.job_modify_post);

/* GET request for deleting a job */
router.get('/job/:id/delete', job_controller.job_delete_get);

/* Post request for deleting a job */
router.post('/:id/delete', job_controller.job_delete_post);

module.exports = router;
