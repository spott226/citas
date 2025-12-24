const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// 🔹 LISTAR EMPLEADAS
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, active
    FROM employees
    ORDER BY name
  `).all();

  res.json(rows);
});

// 🔹 CREAR EMPLEADA
router.post('/', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'El nombre es obligatorio',
    });
  }

  db.prepare(`
    INSERT INTO employees (name, active)
    VALUES (?, 1)
  `).run(name);

  res.json({
    success: true,
    message: 'Empleada creada correctamente',
  });
});

// 🔹 DESACTIVAR EMPLEADA
router.post('/:id/deactivate', (req, res) => {
  const { id } = req.params;

  db.prepare(`
    UPDATE employees
    SET active = 0
    WHERE id = ?
  `).run(id);

  res.json({
    success: true,
    message: 'Empleada desactivada',
  });
});

// 🔹 ACTIVAR EMPLEADA
router.post('/:id/activate', (req, res) => {
  const { id } = req.params;

  db.prepare(`
    UPDATE employees
    SET active = 1
    WHERE id = ?
  `).run(id);

  res.json({
    success: true,
    message: 'Empleada activada',
  });
});

module.exports = router;
