const express = require('express');
const path = require('path');
const authAdminRoutes = require('./routes/admin/auth.admin.routes');

// 🔹 Inicializar base de datos
require('./config/database');

// 🔹 Servicio Google Calendar
const calendarService = require('./services/calendar.service');

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT);

// 🔹 Middleware
app.use(express.json());

const session = require('express-session');
const requireAdmin = require('./middlewares/requireAdmin');

app.use(session({
  secret: 'clave-super-secreta',
  resave: false,
  saveUninitialized: false
}));

// 🔹 Servir frontend público
app.use(express.static(path.join(__dirname, 'public')));

// 🔹 Rutas API públicas
app.use('/services', require('./routes/services.routes'));
app.use('/appointments', require('./routes/appointments.routes'));
app.use('/availability', require('./routes/availability.routes'));

// 🔹 Rutas ADMIN
// LOGIN ADMIN (libre)
app.use('/admin/auth', require('./routes/admin/auth.admin.routes'));

// LOGIN HTML (libre)
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// 🔒 TODO lo que esté bajo /admin se protege
app.use('/admin', requireAdmin);

// PANEL ADMIN
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});
// 🔹 APIs ADMIN (PROTEGIDAS)
app.use('/admin/appointments', require('./routes/admin/appointments.admin.routes'));
app.use('/admin/employees', require('./routes/admin/employees.admin.routes'));
app.use('/admin/employee-services', require('./routes/admin/employee-services.admin.routes'));
app.use('/admin/services', require('./routes/admin/services.admin.routes'));
app.use('/admin/clients', require('./routes/admin/clients.admin.routes'));

// 🔹 Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor funcionando',
    time: new Date().toISOString(),
  });
});

// 🔹 Ruta de prueba Google Calendar
app.get('/test-calendar', async (req, res) => {
  try {
    const event = await calendarService.createEvent({
      summary: 'Prueba Spa',
      description: 'Evento de prueba desde Node.js',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    res.json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    console.error(
      'Google Calendar error:',
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// 🔹 Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
