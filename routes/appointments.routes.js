const express = require('express');
const router = express.Router();
const db = require('../config/database');
const calendarService = require('../services/calendar.service');

// Helper: fecha local para SQLite
function toLocalSQLDate(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

// 🔹 CREAR CITA (CON EMPLEADA)
router.post('/', async (req, res) => {
  const {
    name,
    phone,
    email,
    service_id,
    employee_id,
    start_datetime
  } = req.body;

  // 🔐 VALIDACIÓN FUERTE
  if (!name || !phone || !email || !service_id || !employee_id || !start_datetime) {
    return res.status(400).json({
      success: false,
      error: 'Todos los campos son obligatorios',
    });
  }

  try {
    // Servicio
    const service = db.prepare(`
      SELECT name, duration_minutes
      FROM services
      WHERE id = ?
    `).get(service_id);

    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Servicio no válido',
      });
    }

    // ⏰ Fechas locales
    const start = new Date(start_datetime);
    const end = new Date(start.getTime() + service.duration_minutes * 60000);

    const startSQL = toLocalSQLDate(start);
    const endSQL = toLocalSQLDate(end);

    // 🚫 EMPALME SOLO PARA ESA EMPLEADA (SOLO CITAS ACTIVAS)
const conflict = db.prepare(`
  SELECT id FROM appointments
  WHERE
    employee_id = ?
    AND status IN ('active', 'confirmed')
    AND datetime(start_datetime) < datetime(?)
    AND datetime(end_datetime) > datetime(?)
`).get(
  employee_id,
  endSQL,
  startSQL
);

    // 📅 Google Calendar
    const event = await calendarService.createEvent({
      summary: `${service.name}`,
      description:
        `Cliente: ${name}\nTeléfono: ${phone}\nEmail: ${email}`,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    // 💾 Guardar cita
    db.prepare(`
      INSERT INTO appointments (
        name,
        phone,
        email,
        service_id,
        employee_id,
        start_datetime,
        end_datetime,
        google_event_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      phone,
      email,
      service_id,
      employee_id,
      startSQL,
      endSQL,
      event.id
    );

    res.json({
      success: true,
      message: 'Cita creada correctamente',
    });

  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando la cita',
    });
  }
});

module.exports = router;
