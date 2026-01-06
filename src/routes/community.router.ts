import { Router } from 'express';

import inquiryRoutes from './inquiry.router.js';
import inquiryReplyRoutes from './inquiry-reply.router.js';
import reviewRoutes from './review.router.js';

export const communityRouter = Router();

communityRouter.use('/inquiries', inquiryRoutes);
communityRouter.use('/inquiries', inquiryReplyRoutes);
communityRouter.use('/review', reviewRoutes);
