var express = require('express');
var router = express.Router();
var main_controller = require('../controllers/mainController');

/* GET home page. */
router.get('/', main_controller.index);
router.get('/index', main_controller.index);

module.exports = router;
