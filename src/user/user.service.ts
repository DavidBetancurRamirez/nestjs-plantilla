import * as bcryptjs from 'bcryptjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserResponse, UserActiveInterface, LoginResponse } from '../common/interfaces/user.interface';
import { User } from './entities/user.entity';
import { TokenService } from '../auth/token.service';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto, UpdateMeDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    await this.validateUserExist(createUserDto?.email);

    createUserDto.password = await this.hashPassword(createUserDto.password);

    const userSaved = await this.userRepository.save(createUserDto);
    return this.toUserResponse(userSaved);
  }

  async validateUser(email: string, password: string): Promise<UserResponse> {
    const invalid_message = "Invalid credentials"

    const user = await this.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException(invalid_message);
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(invalid_message);
    }

    return this.toUserResponse(user);
  }

  async findAll(): Promise<UserResponse[]> {
    return await this.userRepository.find({
      order: {
        id: 'ASC'
      }
    });
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.toUserResponse(user);
  }

  async findOneByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user ? this.toUserResponse(user) : null;
  }

  private async findByEmailWithPassword(email: string): Promise<User> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      return null;
    }
    
    const userWithPassword = await this.userRepository.findOne({
      where: { email },
      select: ['password', 'deletedAt'],
    });
    if (!userWithPassword) {
      return null;
    }

    return {
      ...user,
      password: userWithPassword.password,
      deletedAt: userWithPassword.deletedAt
    };
  }

  async profile(email: string): Promise<UserResponse> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    const existingUser = await this.findOne(id);
    return await this.update(existingUser, updateUserDto);
  }

  async updateMe(userActive: UserActiveInterface, updateMeDto: UpdateMeDto): Promise<LoginResponse> {
    const user = await this.profile(userActive.email);
    const userUpdated = await this.update(user, updateMeDto);

    const tokens = user.email !== userUpdated.email 
      ? await this.tokenService.generateTokens(userUpdated) 
      : undefined;

    return {
      accesToken: tokens?.accesToken,
      refreshToken: tokens?.refreshToken,
      data: userUpdated
    };
  }

  private async update(user: UserResponse, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    if (updateUserDto?.email && updateUserDto.email !== user?.email) {
      await this.validateUserExist(updateUserDto.email);
    }

    if (updateUserDto?.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    await this.userRepository.update(user.id, updateUserDto);
    return await this.findOne(user.id);
  }

  async removeUser(id: number): Promise<DeleteUserDto> {
    await this.findOne(id);
    return this.remove(id);
  }

  async removeMe(userActive: UserActiveInterface): Promise<DeleteUserDto> {
    const user = await this.profile(userActive.email);
    return this.remove(user.id);
  }

  private async remove(id: number): Promise<DeleteUserDto> {
    await this.userRepository.softDelete({ id });
    return { message: 'User successfully deleted' };
  }

  async hashPassword(password: string): Promise<string> {
    return await bcryptjs.hash(password, 10);
  }

  private async validateUserExist(email: string) {
    const userExists  = await this.findOneByEmail(email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }
  }

  toUserResponse(user: User): UserResponse {
    delete user["password"];
    delete user["deletedAt"];
    
    return user;
  }
}
