const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'junkyard.db');
const schemaPath = path.join(process.cwd(), 'tables.sql');
const db = new Database(dbPath);

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

export default db;