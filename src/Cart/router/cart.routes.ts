// src/cart/cart.routes.ts
import { Router } from "express";
import * as cartController from "../controller/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { patchCartDto } from "../dtos/cart.dto.js";

const router = Router();

router.post("/", authMiddleware, cartController.createCart);

router.get("/", authMiddleware, cartController.getCart);

router.patch(
  "/",
  authMiddleware,
  validate(patchCartDto),
  cartController.patchCart
);

router.delete(
  "/:cartItemId",
  authMiddleware,
  cartController.deleteCartItem
);


export default router;
