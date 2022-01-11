//TODO flatten the callbacks by using await
//TODO complete reports
//TODO prevent leave overlap
//TODO change task start and end to zulu datetime
var express = require('express');
var router = express.Router();
var index_controller = require('../controllers/indexController');

/* GET home page. */
router.get('/', index_controller.index);
router.get('/index', index_controller.index);

module.exports = router;
