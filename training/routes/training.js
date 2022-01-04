var express = require('express');
var router = express.Router();
var training_controller = require('../controllers/trainingController');

/* GET home page for training. */
router.get('/', training_controller.training_list);

/* GET request for creating an training */
router.get('/create', training_controller.training_create_get);

/* Post request for creating an training */
router.post('/create', training_controller.training_create_post);

/* GET request for modifying an training */
router.get('/training/:id/modify', training_controller.training_modify_get);

/* Post request for modifying an training */
router.post('/training/:id/modify', training_controller.training_modify_post);

/* GET request for deleting an training */
router.get('/training/:id/delete', training_controller.training_delete_get);


module.exports = router;
