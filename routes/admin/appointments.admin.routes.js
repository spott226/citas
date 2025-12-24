const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const calendarService = require('../../services/calendar.service');

// Helper para formatear hora
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ======================================================
// 🔹 LISTADOS
// ======================================================

// 🔹 HOY
router.get('/today', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      a.*,
      s.name AS service,
      e.name AS employee
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE date(a.start_datetime) = date('now','localtime')
      AND a.status != 'cancelada'
    ORDER BY a.start_datetime
  `).all();

  res.json(rows);
});

// 🔹 SEMANA
router.get('/week', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      a.*,
      s.name AS service,
      e.name AS employee
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE date(a.start_datetime)
      BETWEEN date('now','localtime')
      AND date('now','localtime','+7 days')
      AND a.status != 'cancelada'
    ORDER BY a.start_datetime
  `).all();

  res.json(rows);
});

// 🔹 MES
router.get('/month', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      a.*,
      s.name AS service,
      e.name AS employee
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE strftime('%Y-%m', a.start_datetime)
      = strftime('%Y-%m', 'now','localtime')
      AND a.status != 'cancelada'
    ORDER BY a.start_datetime
  `).all();

  res.json(rows);
});

// 🔹 PASADAS
router.get('/past', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      a.*,
      s.name AS service,
      e.name AS employee
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE datetime(a.end_datetime) < datetime('now','localtime')
    ORDER BY a.start_datetime DESC
  `).all();

  res.json(rows);
});

// ======================================================
// ❌ CANCELAR CITA
// ======================================================
router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;

  const appointment = db.prepare(`
    SELECT google_event_id
    FROM appointments
    WHERE id = ?
  `).get(id);

  if (!appointment) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  try {
    // Eliminar evento de Google Calendar
    if (appointment.google_event_id) {
      await calendarService.deleteEvent(appointment.google_event_id);
    }

    // Marcar como cancelada
    db.prepare(`
      UPDATE appointments
      SET status = 'cancelada'
      WHERE id = ?
    `).run(id);

    res.json({ success: true });

  } catch (error) {
    console.error('Error cancelando cita:', error.message);
    res.status(500).json({ error: 'Error cancelando la cita' });
  }
});

// ======================================================
// 🔁 REAGENDAR CITA
// ======================================================
router.post('/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { new_start_datetime } = req.body;

  if (!new_start_datetime) {
    return res.status(400).json({ error: 'Nueva fecha requerida' });
  }

  const appointment = db.prepare(`
    SELECT *
    FROM appointments
    WHERE id = ?
  `).get(id);

  if (!appointment) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  const service = db.prepare(`
    SELECT duration_minutes
    FROM services
    WHERE id = ?
  `).get(appointment.service_id);

  const start = new Date(new_start_datetime);
  const end = new Date(start.getTime() + service.duration_minutes * 60000);

  try {
    // Validar empalme con la MISMA EMPLEADA
    const conflict = db.prepare(`
      SELECT id
      FROM appointments
      WHERE id != ?
        AND employee_id = ?
        AND status != 'cancelada'
        AND datetime(start_datetime) < datetime(?)
        AND datetime(end_datetime) > datetime(?)
    `).get(
      id,
      appointment.employee_id,
      end.toISOString(),
      start.toISOString()
    );

    if (conflict) {
      return res.status(409).json({ error: 'Horario no disponible' });
    }

    // Actualizar Google Calendar
    await calendarService.updateEvent(
      appointment.google_event_id,
      start.toISOString(),
      end.toISOString()
    );

    // Actualizar SQLite
    db.prepare(`
      UPDATE appointments
      SET
        start_datetime = ?,
        end_datetime = ?,
        status = 'reagendada'
      WHERE id = ?
    `).run(
      start.toISOString(),
      end.toISOString(),
      id
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error reagendando cita:', error.message);
    res.status(500).json({ error: 'Error reagendando la cita' });
  }
});

module.exports = router;

// ======================================================
// ✅ CONFIRMAR CITA (ASISTIÓ)
// ======================================================
router.post('/:id/confirm', (req, res) => {
  const { id } = req.params;

  const appointment = db.prepare(`
    SELECT *
    FROM appointments
    WHERE id = ?
  `).get(id);

  if (!appointment) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  // 1️⃣ Marcar cita como atendida
  db.prepare(`
    UPDATE appointments
    SET attended = 1, status = 'confirmada'
    WHERE id = ?
  `).run(id);

  // 2️⃣ Buscar cliente por teléfono
  const existingClient = db.prepare(`
    SELECT id
    FROM clients
    WHERE phone = ?
  `).get(appointment.phone);

  // 3️⃣ SI NO EXISTE → INSERT
  if (!existingClient) {
    db.prepare(`
      INSERT INTO clients (
        name,
        phone,
        email,
        last_visit,
        visits_count,
        created_at
      ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `).run(
      appointment.name,
      appointment.phone,
      appointment.email || null,
      appointment.start_datetime
    );
  } 
  // 4️⃣ SI YA EXISTE → UPDATE + SUMA VISITA
  else {
    db.prepare(`
      UPDATE clients
      SET
        name = ?,
        email = ?,
        last_visit = ?,
        visits_count = visits_count + 1
      WHERE phone = ?
    `).run(
      appointment.name,
      appointment.email || null,
      appointment.start_datetime,
      appointment.phone
    );
  }

  res.json({ success: true });
});