const express = require('express');
const router = express.Router();
const diffusionsController = require('../controllers/diffusionsController');

router.get('/', diffusionsController.getDiffusion);
router.post('/', diffusionsController.addDiffusion);

module.exports = router;