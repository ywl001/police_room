import { createPool, Pool } from "mysql2/promise";

// 创建连接池
const pool: Pool = createPool({
  host: "localhost",
  user: "root",
  password: "123",
  database: "mj_geo", // 改成你的数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const geomCache = new Map<string, string[]>();

/** 获取表中几何字段列表（带缓存） */
export async function getGeomColumns(pool: Pool, table: string, dbName: string): Promise<string[]> {
  if (geomCache.has(table)) return geomCache.get(table)!;

  const sql = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND DATA_TYPE IN ('geometry', 'point', 'polygon', 'multipolygon', 'linestring')
  `;
  const [rows] = await pool.query(sql, [dbName, table]);
  const geomCols = (rows as any[]).map(r => r.COLUMN_NAME);
  geomCache.set(table, geomCols);
  return geomCols;
}

// 测试连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL 连接成功！");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL 连接失败：", error);
  }
}

export default pool;