import { Router } from 'express';

import inquiryRoutes from './inquiry.router.js';
import inquiryReplyRoutes from './inquiry-reply.router.js';
import productRoutes from './product.router.js';
import reviewRoutes from './review.router.js';

const router = Router();

router.use('/inquiries', inquiryRoutes);
router.use('/inquiries', inquiryReplyRoutes);
router.use('/products', productRoutes);
router.use('/product', productRoutes);
router.use('/review', reviewRoutes);
router.use('/reviews', reviewRoutes);

export default router;
