const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// 🔹 Obtener servicios asignados a una empleada
router.get('/:employeeId', (req, res) => {
  const { employeeId } = req.params;

  const rows = db.prepare(`
    SELECT service_id
    FROM employee_services
    WHERE employee_id = ?
  `).all(employeeId);

  res.json(rows.map(r => r.service_id));
});

// 🔹 Guardar servicios de una empleada
router.post('/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const { services } = req.body; // array de service_id

  if (!Array.isArray(services)) {
    return res.status(400).json({ error: 'Servicios inválidos' });
  }

  const deleteStmt = db.prepare(`
    DELETE FROM employee_services
    WHERE employee_id = ?
  `);
  deleteStmt.run(employeeId);

  const insertStmt = db.prepare(`
    INSERT INTO employee_services (employee_id, service_id)
    VALUES (?, ?)
  `);

  services.forEach(serviceId => {
    insertStmt.run(employeeId, serviceId);
  });

  res.json({ success: true });
});

module.exports = router;
