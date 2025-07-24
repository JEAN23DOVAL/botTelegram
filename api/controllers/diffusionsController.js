const db = require('../models/db');

exports.getDiffusion = async (req, res) => {
  const { campaign_id, group_id } = req.query;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM diffusions WHERE campaign_id = ? AND group_id = ? ORDER BY last_sent_at DESC LIMIT 1',
      [campaign_id, group_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addDiffusion = async (req, res) => {
  const { campaign_id, group_id, last_sent_at } = req.body;
  try {
    await db.execute(
      'INSERT INTO diffusions (campaign_id, group_id, last_sent_at) VALUES (?, ?, ?)',
      [campaign_id, group_id, last_sent_at]
    );
    res.status(201).json({ campaign_id, group_id, last_sent_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};