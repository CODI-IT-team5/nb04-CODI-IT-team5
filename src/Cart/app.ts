// src/app.ts
import express from "express";
import cartRouter from "./router/cart.routes.js";
// ... 다른 import들

const app = express();

app.use(express.json());

// ... auth, product 등 기존 라우터들
app.use("/api/cart", cartRouter);

export default app;
