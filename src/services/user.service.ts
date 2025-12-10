import { getByIdResponse } from '../dtos/user.dto.js';
import { userRepository } from '../repositories/user.repository.js';
import { HttpException } from '../utils/http-exception.js';

class UserService {
  getById = async (userId: string) => {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw HttpException.userNotFound();
    }

    const result = await getByIdResponse(user);

    return result;
  };
}

export const userService = new UserService();
