import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  private users: (User & { password: string })[] = [];

  register(dto: CreateUserDto): User {
    const newUser = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      name: dto.name,
      email: dto.email,
      password: dto.password,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    const { password: _pw, ...user } = newUser;
    return user;
  }

  login(dto: LoginDto): { token: string; user: User } {
    const found = this.users.find(u => u.email === dto.email && u.password === dto.password);
    if (!found) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password: _pw, ...user } = found;
    return {
      token: `tok_${Math.random().toString(36).substring(2, 16)}`,
      user,
    };
  }

  getProfile(id: string): User {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password: _pw, ...profile } = user;
    return profile;
  }
}
