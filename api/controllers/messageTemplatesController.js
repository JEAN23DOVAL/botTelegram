const db = require('../models/db');

exports.createTemplate = async (req, res) => {
  const { label, content } = req.body;
  if (!label || !content) return res.status(400).json({ error: 'label et content requis' });
  try {
    const [result] = await db.execute(
      'INSERT INTO message_templates (label, content) VALUES (?, ?)',
      [label, content]
    );
    res.status(201).json({ id: result.insertId, label, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM message_templates ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { label, content } = req.body;
  try {
    await db.execute(
      'UPDATE message_templates SET label = ?, content = ? WHERE id = ?',
      [label, content, id]
    );
    res.json({ id, label, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM message_templates WHERE id = ?', [id]);
    res.json({ message: 'Template supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};