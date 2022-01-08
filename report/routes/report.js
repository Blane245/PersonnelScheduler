var express = require('express');
var router = express.Router();

var report_controller = require('../controllers/reportController');

/* GET request for list of roles in an organization */
router.get('/', report_controller.report_menu);
/* POST request for list of roles in an organization */
router.post('/', report_controller.report_menu_post);
module.exports = router;