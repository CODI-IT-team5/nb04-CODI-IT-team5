import { Router } from 'express';

import inquiryReplyRoutes from './inquiryReplyRoutes.js';
import inquiryRoutes from './inquiryRoutes.js';
import productRoutes from './productRoutes.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router();

router.use('/inquiries', inquiryRoutes);
router.use('/inquiries', inquiryReplyRoutes);
router.use('/products', productRoutes);
router.use('/product', productRoutes);
router.use('/review', reviewRoutes);
router.use('/reviews', reviewRoutes);

export default router;
