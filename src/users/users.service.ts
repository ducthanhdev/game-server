import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userModel.findOne({
      username: userData.username,
    });
    
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const user = new this.userModel(userData);
    return user.save();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already taken by another user
    if (updateData.email) {
      const existingUser = await this.userModel.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new ConflictException('Email already taken');
      }
    }

    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}
