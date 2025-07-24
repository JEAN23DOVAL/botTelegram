const express = require('express');
const router = express.Router();
const affiliateLinksController = require('../controllers/affiliateLinksController');

router.post('/', affiliateLinksController.createLink);
router.get('/:user_id', affiliateLinksController.getLinksByUser);
router.delete('/:id', affiliateLinksController.deleteLink);

module.exports = router;