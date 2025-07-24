const axios = require('axios');
const db = require('../models/db');

const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const CINETPAY_NOTIFY_URL = process.env.CINETPAY_NOTIFY_URL;
const CINETPAY_RETURN_URL = process.env.CINETPAY_RETURN_URL;

const PRICES = { Basic: 0, Pro: 5000, VIP: 10000 };

exports.initPayment = async (req, res) => {
  const { telegram_id, forfait } = req.body;
  if (!telegram_id || !forfait) return res.status(400).json({ error: 'telegram_id et forfait requis' });
  if (!PRICES[forfait]) return res.status(400).json({ error: 'Forfait inconnu' });
  if (forfait === 'Basic') return res.json({ url: null, message: "Le forfait Basic est gratuit." });

  const amount = PRICES[forfait];
  const transaction_id = `${telegram_id}_${forfait}_${Date.now()}`;
  try {
    const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id,
      amount,
      currency: "XAF",
      description: `Achat forfait ${forfait}`,
      notify_url: CINETPAY_NOTIFY_URL,
      return_url: CINETPAY_RETURN_URL,
      customer_name: telegram_id,
      customer_surname: forfait,
      channels: "ALL"
    });
    res.json({ url: response.data.data.payment_url, transaction_id });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

exports.cinetpayCallback = async (req, res) => {
  const { transaction_id, amount, payment_status, payment_method } = req.body;
  if (payment_status !== "ACCEPTED") return res.status(200).send("Ignored");
  const [telegram_id, forfait] = transaction_id.split('_');
  try {
    // Récupère l'user_id
    const [users] = await db.execute('SELECT id FROM users WHERE telegram_id = ?', [telegram_id]);
    const user_id = users.length ? users[0].id : null;
    // Met à jour le forfait
    await db.execute('UPDATE users SET forfait = ? WHERE telegram_id = ?', [forfait, telegram_id]);
    // Log le paiement
    await db.execute(
      `INSERT INTO payments (user_id, telegram_id, forfait, amount, transaction_id, payment_status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, telegram_id, forfait, amount, transaction_id, payment_status, payment_method]
    );
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT payments.*, users.username, users.role 
       FROM payments 
       LEFT JOIN users ON payments.user_id = users.id
       ORDER BY payments.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};