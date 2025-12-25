const { google } = require('googleapis');

// ======================================================
// 🔑 AUTENTICACIÓN CON VARIABLES DE ENTORNO
// ======================================================
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// ======================================================
// 📆 CLIENTE GOOGLE CALENDAR
// ======================================================
const calendar = google.calendar({
  version: 'v3',
  auth,
});

// ======================================================
// 📅 CREAR EVENTO
// ======================================================
async function createEvent({ summary, description, start, end }) {
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: end,
        timeZone: 'America/Mexico_City',
      },
    },
  });

  return response.data;
}

// ======================================================
// ❌ ELIMINAR EVENTO
// ======================================================
async function deleteEvent(eventId) {
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
  });
}

// ======================================================
// 🔁 ACTUALIZAR EVENTO
// ======================================================
async function updateEvent(eventId, start, end) {
  await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    requestBody: {
      start: {
        dateTime: start,
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: end,
        timeZone: 'America/Mexico_City',
      },
    },
  });
}

module.exports = {
  createEvent,
  deleteEvent,
  updateEvent,
};