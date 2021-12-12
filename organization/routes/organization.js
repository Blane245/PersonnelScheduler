var express = require('express');
var router = express.Router();
var organization_controller = require('../controllers/organizationController');

/* GET home page for organizaions. */
router.get('/', organization_controller.organization_list);

module.exports = router;
