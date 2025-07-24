const db = require('../models/db');

exports.addReferral = async (req, res) => {
  const { parrain_id, filleul_id } = req.body;
  if (!parrain_id || !filleul_id) return res.status(400).json({ error: 'parrain_id et filleul_id requis' });
  try {
    await db.execute(
      'INSERT INTO referrals (parrain_id, filleul_id) VALUES (?, ?)',
      [parrain_id, filleul_id]
    );
    res.status(201).json({ parrain_id, filleul_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReferralsByParrain = async (req, res) => {
  const { parrain_id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM referrals WHERE parrain_id = ?', [parrain_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};