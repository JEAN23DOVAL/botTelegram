const db = require('../models/db');

exports.getClicksByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS clicks FROM clicks WHERE user_id = ?',
      [user_id]
    );
    res.json({ user_id, clicks: rows[0].clicks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGlobalStats = async (req, res) => {
  try {
    const [clicks] = await db.execute('SELECT COUNT(*) AS total_clicks FROM clicks');
    const [links] = await db.execute('SELECT COUNT(*) AS total_links FROM affiliate_links');
    const [users] = await db.execute('SELECT COUNT(*) AS total_users FROM users');
    res.json({
      total_clicks: clicks[0].total_clicks,
      total_links: links[0].total_links,
      total_users: users[0].total_users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};