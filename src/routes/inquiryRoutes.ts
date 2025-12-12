import { Router } from 'express';

import inquiryController from '../controllers/inquiryController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, inquiryController.getMyInquiries.bind(inquiryController));

router.get('/:inquiryId', authMiddleware, inquiryController.getInquiryById.bind(inquiryController));

router.patch('/:inquiryId', authMiddleware, inquiryController.updateInquiry.bind(inquiryController));

router.delete('/:inquiryId', authMiddleware, inquiryController.deleteInquiry.bind(inquiryController));

export default router;
