import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserWithoutPassword {
  _id: any;
  username: string;
  email: string;
  nickname: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { ...updateUserDto, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const { password, ...userWithoutPassword } = user.toObject();
    return {
      _id: userWithoutPassword._id,
      username: userWithoutPassword.username,
      email: userWithoutPassword.email,
      nickname: userWithoutPassword.nickname,
      createdAt: (userWithoutPassword as any).createdAt,
      updatedAt: (userWithoutPassword as any).updatedAt,
    } as UserWithoutPassword;
  }
}
