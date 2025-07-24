const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');

router.post('/init', paymentsController.initPayment);
router.post('/cinetpay/callback', paymentsController.cinetpayCallback);
router.get('/:user_id', paymentsController.getPaymentsByUser);
router.get('/', paymentsController.getAllPayments);

module.exports = router;