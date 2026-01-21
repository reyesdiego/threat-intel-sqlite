import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(__dirname, '../../../sqlite/threat_intel.db');
const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
