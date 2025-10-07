import { Request, Response } from "express";
import pool, { getGeomColumns } from "./db";

// 允许操作的表白名单
const allowTables = ["room", "town", "village"];

// 特殊字段处理
function processValue(col: string, val: any) {
  if (col === "include_villages" && Array.isArray(val)) return JSON.stringify(val);
  return val?.trim?.() ?? val;
}

// 创建
export async function createRecord(req: Request, res: Response) {
  try {
    const table = req.params.table as string;
    const data = req.body;

    if (!allowTables.includes(table)) {
      return res.status(400).json({ error: "非法表名" });
    }

    // ✅ 获取表的几何列
    const geomCols = await getGeomColumns(pool, table, "mj_geo");

    const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
    const columns = entries.map(([k]) => k);
    const values = entries.map(([k, v]) => processValue(k, v));
    const placeholders = columns.map((c) => (geomCols.includes(c) ? "ST_GeomFromText(?,4326)" : "?"));

    if (columns.length === 0) return res.status(400).json({ error: "没有可插入字段" });

    const sql = `INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders.join(",")})`;
    const [result] = await pool.query(sql, values);

    res.json({ message: "插入成功", result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

// 更新
export async function updateRecord(req: Request, res: Response) {
  try {
    const table = req.params.table as string;
    const id = req.params.id;
    const data = req.body;

    if (!allowTables.includes(table)) {
      return res.status(400).json({ error: "非法表名" });
    }

    const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
    if (entries.length === 0) return res.status(400).json({ error: "没有可更新字段" });

    const geomCols = await getGeomColumns(pool, table, "mj_geo");

    const updates = entries.map(([k, _]) => (geomCols.includes(k) ? `${k} = ST_GeomFromText(?,4326)` : `${k} = ?`)).join(", ");

    const values = entries.map(([k, v]) => processValue(k, v));
    values.push(id);

    const sql = `UPDATE ${table} SET ${updates} WHERE id = ?`;
    const [result] = await pool.query(sql, values);

    res.json({ message: "更新成功", result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

// 删除
export async function deleteRecord(req: Request, res: Response) {
  try {
    const table = req.params.table as string;
    const id = req.params.id;

    if (!allowTables.includes(table)) {
      return res.status(400).json({ error: "非法表名" });
    }

    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);

    res.json({ message: "删除成功", result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

// ------------------- 查询分开写 -------------------

// room
export async function getRoomsByTown(req: Request, res: Response) {
  try {
    const { town } = req.query;
    let sql = "SELECT * FROM room";
    const params: any[] = [];

    if (town) {
      sql += " WHERE town = ?";
      params.push(town);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getRoomById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const sql = "SELECT * FROM room WHERE id = ?";
    const [rows]: any = await pool.query(sql, [id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

// town
export async function getTowns(req: Request, res: Response) {
  try {
    const sql = "SELECT * FROM town";
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTownById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const sql = "SELECT * FROM town WHERE id = ?";
    const [rows]: any = await pool.query(sql, [id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

// village
export async function getVillagesByTown(req: Request, res: Response) {
  try {
    const { town } = req.query;
    // let sql = "SELECT * FROM village";

    let sql =`SELECT v.*,
              r.id AS room_id,
              r.name AS room_name
              FROM village v
              LEFT JOIN room r
                ON FIND_IN_SET(v.id, REPLACE(REPLACE(r.include_villages,'[',''),']','')) > 0 `
    const params: any[] = [];

    if (town) {
      sql += " WHERE v.town = ?";
      params.push(town);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getVillageById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const sql = "SELECT * FROM village WHERE id = ?";
    const [rows]: any = await pool.query(sql, [id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
