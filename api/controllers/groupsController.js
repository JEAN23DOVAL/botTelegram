const db = require('../models/db');

exports.createGroup = async (req, res) => {
  const { user_id, group_name, category, is_owner } = req.body;
  if (!user_id || !group_name) return res.status(400).json({ error: 'user_id et group_name requis' });
  try {
    const [result] = await db.execute(
      'INSERT INTO groups (user_id, group_name, category, is_owner) VALUES (?, ?, ?, ?)',
      [user_id, group_name, category || null, typeof is_owner === "boolean" ? is_owner : true]
    );
    res.status(201).json({ id: result.insertId, user_id, group_name, category, is_owner: typeof is_owner === "boolean" ? is_owner : true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer les groupes propres (is_owner = TRUE) d'un utilisateur
exports.getOwnGroupsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM groups WHERE user_id = ? AND is_owner = TRUE', [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer les groupes tiers (is_owner = FALSE) accessibles à un utilisateur (ex: partenaire)
exports.getTiersGroups = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM groups WHERE is_owner = FALSE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAdminStatus = async (req, res) => {
  const { id } = req.params;
  const { is_admin } = req.body;
  try {
    await db.execute(
      'UPDATE groups SET is_admin = ?, last_checked_at = NOW() WHERE id = ?',
      [is_admin, id]
    );
    res.json({ id, is_admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer les groupes où le bot est admin pour un utilisateur
exports.getAdminGroupsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM groups WHERE user_id = ? AND is_admin = TRUE', [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disableGroup = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('UPDATE groups SET is_active = FALSE WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO group_logs (admin_id, group_id, action, details) VALUES (?, ?, ?, ?)',
      [admin_id, id, 'disable', 'Groupe désactivé']
    );
    res.json({ id, status: 'disabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enableGroup = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('UPDATE groups SET is_active = TRUE WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO group_logs (admin_id, group_id, action, details) VALUES (?, ?, ?, ?)',
      [admin_id, id, 'enable', 'Groupe réactivé']
    );
    res.json({ id, status: 'enabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('DELETE FROM groups WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO group_logs (admin_id, group_id, action, details) VALUES (?, ?, ?, ?)',
      [admin_id, id, 'delete', 'Groupe supprimé']
    );
    res.json({ message: 'Groupe supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupLogs = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT group_logs.*, u.username AS admin_name
       FROM group_logs
       LEFT JOIN users u ON group_logs.admin_id = u.id
       ORDER BY group_logs.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};