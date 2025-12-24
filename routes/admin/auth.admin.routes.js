const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const bcrypt = require('bcrypt');

// LOGIN
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const admin = db.prepare(`
    SELECT id, username, password_hash, active
    FROM admins
    WHERE username = ?
  `).get(username);

  if (!admin || admin.active !== 1) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const ok = bcrypt.compareSync(password, admin.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // 👉 sesión
  req.session.admin = {
    id: admin.id,
    username: admin.username
  };

  res.json({ success: true });
});

// SESIÓN ACTIVA
router.get('/me', (req, res) => {
  if (req.session.admin) {
    return res.json({ logged: true });
  }
  res.status(401).json({ logged: false });
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;