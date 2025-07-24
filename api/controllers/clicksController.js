const db = require('../models/db');

exports.redirectLink = async (req, res) => {
  const { id } = req.params;
  const user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const source_channel = req.query.source || null;
  try {
    const [rows] = await db.execute('SELECT * FROM affiliate_links WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Lien non trouvé' });
    const link = rows[0];
    await db.execute(
      'INSERT INTO clicks (user_id, affiliate_link, user_ip, source_channel) VALUES (?, ?, ?, ?)',
      [link.user_id, link.url, user_ip, source_channel]
    );
    res.redirect(link.url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};