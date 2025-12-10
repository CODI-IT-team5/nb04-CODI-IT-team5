import { Router } from 'express';
import inquiryController from '../controllers/inquiryController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, inquiryController.getMyInquiries.bind(inquiryController));

router.get('/:inquiryId', authenticate, inquiryController.getInquiryById.bind(inquiryController));

router.patch('/:inquiryId', authenticate, inquiryController.updateInquiry.bind(inquiryController));

router.delete('/:inquiryId', authenticate, inquiryController.deleteInquiry.bind(inquiryController));

export default router;
