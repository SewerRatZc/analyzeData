import Database from 'better-sqlite3';
import { join, basename } from 'path';
import fs from 'fs';

// // 初始化数据库，处理增删改查数据库相关操作
// export function setupDatabase() {
//   // 去掉文件扩展名，确保数据库文件名不包含 .txt 等后缀
//   const baseFileName = basename(fileName, '.txt');

//   const dbPath = join(__dirname, `../..data_${baseFileName}.db`);
//   const db = new Database(dbPath);
//   db.exec(`   
//     CREATE TABLE IF NOT EXISTS data_blocks (   --创建数据块表
//       block_number INTEGER PRIMARY KEY,
//       file_path TEXT,
//       start_offset INTEGER,  --起始量
//       end_offset INTEGER     --结束的偏移量
//     );

//     CREATE TABLE IF NOT EXISTS timestamp_index (    --创建时间戳索引表
//       timestamp INTEGER PRIMARY KEY,    
//       block_number INTEGER
//     );
//   `);
//   return db;
// }
export function setupDatabase(fileName) {
  try {
    console.log(`======File Name Before setupDatabase: ${fileName}======`);

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
    //INSERT OR IGNORE ： 如果主键存在就忽略重复插入
    console.log(`Inserting blockNumber: ${blockNumber} with filePath: ${filePath}`);

    const stmt = db.prepare('INSERT OR IGNORE INTO data_blocks (block_number, file_path, start_offset, end_offset) VALUES (?, ?, ?, ?)');
    stmt.run(blockNumber, filePath, startOffset, endOffset);
    console.log(`=======insert blockNumber: ${blockNumber} into data_blocks.=======`);
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
      console.log(`=======${timestamp} timestamp was create,escape to insert=====`);
      return;
    }
    const stmt = db.prepare('INSERT INTO timestamp_index (timestamp, block_number) VALUES (?, ?)');
    stmt.run(timestamp, blockNumber);
    console.log(`=====insert timestamp:${timestamp} into block number:${blockNumber}========`);
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
