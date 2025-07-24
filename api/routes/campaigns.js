const express = require('express');
const router = express.Router();
const campaignsController = require('../controllers/campaignsController');

router.post('/', campaignsController.createCampaign);
router.post('/:campaign_id/links', campaignsController.addLinksToCampaign);
router.post('/:campaign_id/groups', campaignsController.addGroupsToCampaign);
router.put('/:id/disable', campaignsController.disableCampaign);
router.put('/:id/enable', campaignsController.enableCampaign);
router.delete('/:id', campaignsController.deleteCampaign);
router.get('/logs', campaignsController.getCampaignLogs);

module.exports = router;