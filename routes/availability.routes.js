const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 🔹 Empleadas disponibles para un servicio y horario
router.get('/', (req, res) => {
  const { service_id, start_datetime } = req.query;

  if (!service_id || !start_datetime) {
    return res.status(400).json({
      error: 'Faltan parámetros',
    });
  }

  // Obtener duración del servicio
  const service = db.prepare(`
    SELECT duration_minutes
    FROM services
    WHERE id = ?
  `).get(service_id);

  if (!service) {
    return res.status(400).json({
      error: 'Servicio no válido',
    });
  }

  const start = new Date(start_datetime);
  const end = new Date(start.getTime() + service.duration_minutes * 60000);

  /*
    CORRECCIÓN CLAVE:
    - Solo citas ACTIVAS bloquean
    - Canceladas NO
  */
  const rows = db.prepare(`
    SELECT e.id, e.name
    FROM employees e
    JOIN employee_services es
      ON e.id = es.employee_id
    WHERE
      e.active = 1
      AND es.service_id = ?
      AND e.id NOT IN (
        SELECT employee_id
        FROM appointments
        WHERE
          status IN ('active', 'confirmed')
          AND datetime(start_datetime) < datetime(?)
          AND datetime(end_datetime) > datetime(?)
      )
    ORDER BY e.name
  `).all(
    service_id,
    end.toISOString(),
    start.toISOString()
  );

  res.json(rows);
});

module.exports = router;
