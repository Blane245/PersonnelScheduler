//TODO flatten the callbacks by using await #
var express = require('express');
var router = express.Router();
var index_controller = require('../controllers/indexController');

/* GET home page. */
router.get('/', index_controller.index);
router.get('/index', index_controller.index);

module.exports = router;
