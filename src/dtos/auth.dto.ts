import { userBaseBody } from './user.dto.js';

export const authDto = {
  login: userBaseBody.pick({ email: true, password: true }),
};
