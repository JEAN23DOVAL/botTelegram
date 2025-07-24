const express = require('express');
const router = express.Router();
const clicksController = require('../controllers/clicksController');

router.get('/redirect/:id', clicksController.redirectLink);

module.exports = router;