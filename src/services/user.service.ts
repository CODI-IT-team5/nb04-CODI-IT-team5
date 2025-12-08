import { MESSAGE, STATUS_CODE } from '../constants/constant.js';
import { userRepository } from '../repositories/user.repository.js';
import { HttpException } from '../utils/http-exception.js';

class UserService {
  getById = async (userId: string) => {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new HttpException({
        status: STATUS_CODE.NOT_FOUND,
        message: MESSAGE.userNotFound,
      });
    }

    const result = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      points: user.points,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      grade: {
        name: user.grade.name,
        id: user.grade.id,
        rate: user.grade.rate,
        minAmount: user.grade.minAmount,
      },
      image: user.image,
    };

    return result;
  };
}

export const userService = new UserService();
