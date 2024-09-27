import Database from 'better-sqlite3';
import { join, basename } from 'path';
import fs from 'fs';

export function setupDatabase(fileName) {
  try {
    const dbDirPath = join(__dirname, '../../dataBases');

    // 如果文件夹不存在，创建它
    if (!fs.existsSync(dbDirPath)) {
      fs.mkdirSync(dbDirPath, { recursive: true });
      console.log(`Created directory: ${dbDirPath}`);
    }

    // 去掉文件扩展名，确保数据库文件名不包含 .txt 等后缀
    const dbPath = join(__dirname, `../../dataBases/data_${fileName}.db`);
    const db = new Database(dbPath);


    // const dbPath = join(dbDirPath, `data_${fileName}.db`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS data_blocks (
        block_number INTEGER PRIMARY KEY,
        file_path TEXT,
        start_offset INTEGER,
        end_offset INTEGER
      );
      CREATE TABLE IF NOT EXISTS timestamp_index (
        timestamp INTEGER PRIMARY KEY,
        block_number INTEGER
      );
    `);
    return db;
  } catch (error) {
    console.error(`Error setting up database: ${error}`);
    throw error;
  }
}

// 插入数据块信息
export function insertDataBlock(db, blockNumber, filePath, startOffset, endOffset) {
  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO data_blocks (block_number, file_path, start_offset, end_offset) VALUES (?, ?, ?, ?)');
    stmt.run(blockNumber, filePath, startOffset, endOffset);
  } catch (error) {
    console.error('Error inserting data block:', error);
    throw error;
  }
}

// 插入时间戳索引，避免重复      （数据库连接对象，）
export function insertTimestampIndex(db, timestamp, blockNumber) {
  try {

    const checkStmt = db.prepare('SELECT COUNT(*) AS count FROM timestamp_index WHERE timestamp = ?');
    const result = checkStmt.get(timestamp);

    if (result.count > 0) {
      return;
    }
    const stmt = db.prepare('INSERT INTO timestamp_index (timestamp, block_number) VALUES (?, ?)');
    stmt.run(timestamp, blockNumber);
  } catch (error) {
    console.error('Error inserting timestamp index:', error);
    throw error;
  }
}

// 根据时间戳查找块号
export function getBlockByTimestamp(db, timestamp) {
  const stmt = db.prepare('SELECT block_number FROM timestamp_index WHERE timestamp = ?');
  return stmt.get(timestamp);
}

// 根据块号获取块数据
export function getBlockData(db, blockNumber) {
  const stmt = db.prepare('SELECT * FROM data_blocks WHERE block_number = ?');
  return stmt.get(blockNumber);
}
