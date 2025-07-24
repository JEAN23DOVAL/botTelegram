const db = require('../models/db');

exports.createLink = async (req, res) => {
  const { user_id, url, type } = req.body;
  if (!user_id || !url) return res.status(400).json({ error: 'user_id et url requis' });
  try {
    const [result] = await db.execute(
      'INSERT INTO affiliate_links (user_id, url, type) VALUES (?, ?, ?)',
      [user_id, url, type || null]
    );
    res.status(201).json({ id: result.insertId, user_id, url, type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLinksByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM affiliate_links WHERE user_id = ?', [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLink = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM affiliate_links WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lien non trouvé' });
    res.json({ message: 'Lien supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};