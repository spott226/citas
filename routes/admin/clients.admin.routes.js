const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// 🔹 LISTAR CLIENTES
router.get('/', (req, res) => {
  const clients = db.prepare(`
    SELECT
      id,
      name,
      phone,
      email,
      birthday,
      visits_count,
      last_visit
    FROM clients
    ORDER BY last_visit DESC
  `).all();

  res.json(clients);
});

module.exports = router;