const { google } = require('googleapis');
const path = require('path');

// Ruta EXACTA al JSON de la service account
const KEYFILEPATH = path.join(
  __dirname,
  '../config/credentials/sistema-de-citas-chelii-spa-950a2904d0f0.json'
);

// Alcances de Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Autenticación con Service Account
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

// Cliente de Google Calendar
const calendar = google.calendar({
  version: 'v3',
  auth,
});

// ======================================================
// 📅 CREAR EVENTO
// ======================================================
async function createEvent({ summary, description, start, end }) {
  const response = await calendar.events.insert({
    calendarId: 'uses88767@gmail.com',
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
// ❌ ELIMINAR EVENTO (CANCELAR CITA)
// ======================================================
async function deleteEvent(eventId) {
  await calendar.events.delete({
    calendarId: 'uses88767@gmail.com',
    eventId,
  });
}

// ======================================================
// 🔁 ACTUALIZAR EVENTO (REAGENDAR CITA)
// ======================================================
async function updateEvent(eventId, start, end) {
  await calendar.events.patch({
    calendarId: 'uses88767@gmail.com',
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

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  createEvent,
  deleteEvent,
  updateEvent,
};
