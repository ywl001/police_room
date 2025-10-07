import express from "express";
import {
    createRecord,
    updateRecord,
    deleteRecord,
    getRoomsByTown,
    getRoomById,
    getTowns,
    getTownById,
    getVillagesByTown,
    getVillageById
} from "./controller";

const router = express.Router();

// 通用 CRUD
router.post("/:table", createRecord);          // 插入
router.put("/:table/:id", updateRecord);       // 更新
router.delete("/:table/:id", deleteRecord);    // 删除

// 查询分开写
router.get("/room", getRoomsByTown);
// 按 town 查询 room /api/room?town=城关镇
// router.get("/room/:id", getRoomById);          // 查询单个 room

router.get("/town", getTowns);                 // 查询所有 town
// router.get("/town/:id", getTownById);          // 查询单个 town

router.get("/village", getVillagesByTown);
// 按 town 查询 village /api/village?town=城关镇
// router.get("/village/:id", getVillageById);   // 查询单个 village

export default router;

