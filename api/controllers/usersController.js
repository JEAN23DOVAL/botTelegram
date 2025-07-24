const db = require('../models/db');

// CRUD utilisateurs
exports.createUser = async (req, res) => {
  const { telegram_id, username, role, forfait, parrain_id, business, pays, ville, sexe } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id requis' });
  try {
    const [result] = await db.execute(
      `INSERT INTO users (telegram_id, username, role, forfait, parrain_id, business, pays, ville, sexe)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [telegram_id, username || null, role || 'partner', forfait || 'Basic', parrain_id || null, business || null, pays || null, ville || null, sexe || null]
    );
    res.status(201).json({ id: result.insertId, telegram_id, username, role, forfait, parrain_id, business, pays, ville, sexe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, role, forfait, business, pays, ville, sexe } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE users SET username = ?, role = ?, forfait = ?, business = ?, pays = ?, ville = ?, sexe = ? WHERE id = ?`,
      [username, role, forfait, business, pays, ville, sexe, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ id, username, role, forfait, business, pays, ville, sexe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disableUser = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('UPDATE users SET role = "disabled" WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)',
      [admin_id, 'disable', id, 'Utilisateur désactivé']
    );
    res.json({ id, status: 'disabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enableUser = async (req, res) => {
  const { id } = req.params;
  const { admin_id, previous_role } = req.body;
  try {
    await db.execute('UPDATE users SET role = ? WHERE id = ?', [previous_role || 'client', id]);
    await db.execute(
      'INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)',
      [admin_id, 'enable', id, 'Utilisateur réactivé']
    );
    res.json({ id, status: 'enabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.body;
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    await db.execute(
      'INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)',
      [admin_id, 'delete', id, 'Utilisateur supprimé']
    );
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT admin_logs.*, u.username AS admin_name
       FROM admin_logs
       LEFT JOIN users u ON admin_logs.admin_id = u.id
       ORDER BY admin_logs.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.upsertUser = async (req, res) => {
  const { telegram_id, username, role, forfait, parrain_id, business, pays, ville, sexe } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id requis' });
  try {
    // Vérifie si l'utilisateur existe
    const [rows] = await db.execute('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]);
    if (rows.length > 0) {
      // Mise à jour username et champs modifiables
      await db.execute(
        `UPDATE users SET username = ?, role = ?, forfait = ?, business = ?, pays = ?, ville = ?, sexe = ? WHERE telegram_id = ?`,
        [username, role || rows[0].role, forfait || rows[0].forfait, business || rows[0].business, pays || rows[0].pays, ville || rows[0].ville, sexe || rows[0].sexe, telegram_id]
      );
      const [updated] = await db.execute('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]);
      return res.json(updated[0]);
    } else {
      // Création
      const [result] = await db.execute(
        `INSERT INTO users (telegram_id, username, role, forfait, parrain_id, business, pays, ville, sexe)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [telegram_id, username || null, role || 'client', forfait || 'Basic', parrain_id || null, business || null, pays || null, ville || null, sexe || null]
      );
      const [created] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return res.status(201).json(created[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateForfaitByTelegramId = async (req, res) => {
  const { telegram_id } = req.params;
  const { forfait } = req.body;
  if (!forfait) return res.status(400).json({ error: 'forfait requis' });
  try {
    const [result] = await db.execute(
      'UPDATE users SET forfait = ? WHERE telegram_id = ?',
      [forfait, telegram_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ telegram_id, forfait });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoleOrForfait = async (req, res) => {
  const { id } = req.params;
  const { role, forfait } = req.body;
  if (!role && !forfait) return res.status(400).json({ error: 'role ou forfait requis' });
  try {
    let query = 'UPDATE users SET ';
    let params = [];
    if (role) {
      query += 'role = ?';
      params.push(role);
    }
    if (forfait) {
      if (role) query += ', ';
      query += 'forfait = ?';
      params.push(forfait);
    }
    query += ' WHERE id = ?';
    params.push(id);
    const [result] = await db.execute(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ id, role, forfait });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};