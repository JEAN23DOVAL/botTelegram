const express = require('express');
const router = express.Router();
const referralsController = require('../controllers/referralsController');

router.post('/', referralsController.addReferral);
router.get('/:parrain_id', referralsController.getReferralsByParrain);

module.exports = router;