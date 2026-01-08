import { userBaseBody } from './user.dto.js';

export const authDto = {
  login: { body: userBaseBody.pick({ email: true, password: true }) },
};
