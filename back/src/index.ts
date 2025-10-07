// src/index.ts
import express from "express";
import router from "./router";
import { testConnection } from "./db";
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

// 挂载路由
app.use("/api", router);

// 测试根路由
app.get("/", (req, res) => {
    res.json({ message: "Hello Node.js + TS!" });
});

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await testConnection();
});
