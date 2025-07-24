const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messageTemplatesController');

router.post('/', ctrl.createTemplate);
router.get('/', ctrl.getTemplates);
router.put('/:id', ctrl.updateTemplate);
router.delete('/:id', ctrl.deleteTemplate);

module.exports = router;