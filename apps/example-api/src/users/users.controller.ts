import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { User } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register/test')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateUserDto): User {
    return this.usersService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): { token: string; user: User } {
    return this.usersService.login(dto);
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  getProfile(@Param('id') id: string): User {
    return this.usersService.getProfile(id);
  }
}

@Controller("auth")
export class AuthController {
  @Post("login")
  login() {

  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me() {

  }
}

@Controller()
export class RootController {
  @Get("root")
  root() {
    return "Root";
  }
}
