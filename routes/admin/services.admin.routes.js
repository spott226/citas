const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// LISTAR SERVICIOS
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, duration_minutes, description
    FROM services
    ORDER BY name
  `).all();
  res.json(rows);
});

// CREAR SERVICIO
router.post('/', (req, res) => {
  const { name, duration_minutes, description } = req.body;

  if (!name || !duration_minutes) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  db.prepare(`
    INSERT INTO services (name, duration_minutes, description)
    VALUES (?, ?, ?)
  `).run(name, duration_minutes, description || null);

  res.json({ success: true });
});

// EDITAR SERVICIO
router.put('/:id', (req, res) => {
  const { name, duration_minutes, description } = req.body;

  db.prepare(`
    UPDATE services
    SET name = ?, duration_minutes = ?, description = ?
    WHERE id = ?
  `).run(name, duration_minutes, description || null, req.params.id);

  res.json({ success: true });
});

// ELIMINAR SERVICIO
router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM services WHERE id = ?`)
    .run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
