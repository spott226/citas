const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/app.db');

// Crear DB si no existe
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
}

const db = new Database(dbPath);

// Ejecutar init.sql
const initSQL = fs.readFileSync(
  path.join(__dirname, '../database/init.sql'),
  'utf8'
);

db.exec(initSQL);

module.exports = db;