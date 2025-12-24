const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener servicios del spa
router.get('/', (req, res) => {
  const services = db
    .prepare('SELECT id, name, duration_minutes FROM services')
    .all();

  res.json(services);
});

module.exports = router;
