import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '../common/enums/rol.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import { ResponsesSecurity } from '../common/decorators/responses-security.decorator';
import { UserResponse, UserActiveInterface, LoginResponse } from '../common/interfaces/user.interface';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto, UpdateMeDto } from './dto/update-user.dto';

@ApiTags('user')
@ResponsesSecurity()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Profile' })
  @Auth([Role.USER])
  profile(@ActiveUser() userActive: UserActiveInterface): Promise<UserResponse> {
    return this.userService.profile(userActive.email);
  }

  @Patch()
  @ApiOperation({ summary: 'Update' })
  @ApiBody({ type: CreateUserDto })
  @Auth([Role.USER])
  updateMe(
    @ActiveUser() userActive: UserActiveInterface, 
    @Body() updateMeDto: UpdateMeDto
  ): Promise<LoginResponse> {
    return this.userService.updateMe(userActive, updateMeDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove' })
  @Auth([Role.USER])
  removeMe(@ActiveUser() userActive: UserActiveInterface): Promise<DeleteUserDto> {
    return this.userService.removeMe(userActive);
  }


  // Admin methods
  @Get('users')
  @ApiOperation({ summary: 'FindAll' })
  @Auth([Role.ADMIN])
  findAll(): Promise<UserResponse[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'FindOne' })
  @Auth([Role.ADMIN])
  findOne(@Param('id') id: number): Promise<UserResponse> {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'CreateUser' })
  @Auth([Role.ADMIN])
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'UpdateUser' })
  @ApiBody({ type: CreateUserDto })
  @Auth([Role.ADMIN])
  update(
    @Param('id') id: number, 
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponse> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'RemoveUser' })
  @Auth([Role.ADMIN])
  remove(@Param('id') id: number): Promise<DeleteUserDto> {
    return this.userService.removeUser(id);
  }
}
