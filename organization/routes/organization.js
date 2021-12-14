var express = require('express');
var router = express.Router();
var organization_controller = require('../controllers/organizationController');

/* GET home page for organizaions. */
router.get('/', organization_controller.organization_list);

/* GET request for creating an organization */
router.get('/create', organization_controller.organization_create_get);

/* Post request for creating an organization */
router.post('/create', organization_controller.organization_create_post);

/* GET request for modifying an organization */
router.get('/organization/:id/modify', organization_controller.organization_modify_get);

/* Post request for modifying an organization */
router.post('/organization/:id/modify', organization_controller.organization_modify_post);

/* GET request for deleting an organization */
router.get('/organization/:id/delete', organization_controller.organization_delete_get);

/* Post request for deleting an organization */
router.post('/organization/:id/delete', organization_controller.organization_delete_post);

/* GET request for list of jobs in an organization */
router.get('/organization/:orgid/jobs', organization_controller.organization_job_list);


module.exports = router;
