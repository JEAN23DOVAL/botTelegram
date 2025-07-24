const db = require('../models/db');

exports.createCampaign = async (req, res) => {
  const { user_id, name, message, image_id, frequency, status } = req.body;
  if (!user_id || !name) return res.status(400).json({ error: 'user_id et name requis' });
  try {
    const [result] = await db.execute(
      `INSERT INTO campaigns (user_id, name, message, image_id, frequency, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, name, message || null, image_id || null, frequency || 24, status || 'active']
    );
    res.status(201).json({ id: result.insertId, user_id, name, message, image_id, frequency, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addLinksToCampaign = async (req, res) => {
  const { campaign_id } = req.params;
  const { link_ids } = req.body; // Tableau d'IDs de liens affiliés
  if (!Array.isArray(link_ids) || link_ids.length === 0) return res.status(400).json({ error: 'link_ids requis' });
  try {
    for (const link_id of link_ids) {
      await db.execute(
        'INSERT INTO campaign_links (campaign_id, link_id) VALUES (?, ?)',
        [campaign_id, link_id]
      );
    }
    res.json({ campaign_id, link_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addGroupsToCampaign = async (req, res) => {
  const { campaign_id } = req.params;
  const { group_ids } = req.body; // Tableau d'IDs de groupes
  if (!Array.isArray(group_ids) || group_ids.length === 0) return res.status(400).json({ error: 'group_ids requis' });
  try {
    for (const group_id of group_ids) {
      await db.execute(
        'INSERT INTO campaign_groups (campaign_id, group_id) VALUES (?, ?)',
        [campaign_id, group_id]
      );
    }
    res.json({ campaign_id, group_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disableCampaign = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('UPDATE campaigns SET status = "paused" WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO campaign_logs (admin_id, campaign_id, action, details) VALUES (?, ?, ?, ?)',
      [admin_id, id, 'disable', 'Campagne désactivée']
    );
    res.json({ id, status: 'paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enableCampaign = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('UPDATE campaigns SET status = "active" WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO campaign_logs (admin_id, campaign_id, action, details) VALUES (?, ?, ?, ?)',
      [admin_id, id, 'enable', 'Campagne réactivée']
    );
    res.json({ id, status: 'active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('DELETE FROM campaigns WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO campaign_logs (admin_id, campaign_id, action, details) VALUES (?, ?, ?, ?)',
      [admin_id, id, 'delete', 'Campagne supprimée']
    );
    res.json({ message: 'Campagne supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCampaignLogs = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT campaign_logs.*, u.username AS admin_name
       FROM campaign_logs
       LEFT JOIN users u ON campaign_logs.admin_id = u.id
       ORDER BY campaign_logs.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};