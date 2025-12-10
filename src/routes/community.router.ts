import { Router } from 'express';
import inquiryRoutes from './inquiryRoutes.js';
import inquiryReplyRoutes from './inquiryReplyRoutes.js';
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
