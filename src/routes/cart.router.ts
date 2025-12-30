// src/cart/cart.routes.ts
import { Router } from 'express';

import * as cartController from '../controllers/cart.controller.js';
import { patchCartDto } from '../dtos/cart.dto.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';

export const cartRouter = Router();

cartRouter.post('/', authMiddleware, cartController.createCart);

cartRouter.get('/', authMiddleware, cartController.getCart);

cartRouter.patch('/', authMiddleware, validateMiddleware({ body: patchCartDto }), cartController.patchCart);

cartRouter.delete('/:cartItemId', authMiddleware, cartController.deleteCartItem);

cartRouter.get('/:cartItemId', authMiddleware, cartController.getCartItem);
