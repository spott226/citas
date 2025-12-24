const fs = require('fs');
const path = require('path');

// Rutas importantes
const DB_PATH = path.join(__dirname, '../database/app.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Crear carpeta backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Obtener fecha YYYY-MM-DD
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Ejecutar backup
function runBackup() {
  const backupFile = `backup-${getToday()}.db`;
  const backupPath = path.join(BACKUP_DIR, backupFile);

  // Si ya existe backup de hoy, no duplicar
  if (fs.existsSync(backupPath)) {
    console.log('📦 Backup ya existe para hoy');
    return;
  }

  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`✅ Backup creado: ${backupFile}`);

  cleanOldBackups();
}

// Eliminar respaldos antiguos (mantener solo 7)
function cleanOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .sort()
    .reverse();

  files.slice(7).forEach(file => {
    fs.unlinkSync(path.join(BACKUP_DIR, file));
    console.log(`🗑️ Backup eliminado: ${file}`);
  });
}

module.exports = {
  runBackup,
};
