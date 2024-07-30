import * as bcrypt from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { LoginDto, RegisterDto, VerifyDto } from './dto';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async login(data: LoginDto) {
    const user = await this.findOneByEmail(data.email);
    if (!user) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (!bcrypt.compareSync(data.password, user.password)) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      });
    }

    delete user.password;

    return {
      user,
      token: await this.generateToken(user),
    };
  }

  private async generateToken(user: User) {
    return await this.jwtService.signAsync({ id: user.id, email: user.email });
  }

  private async verifyToken(token: string) {
    return await this.jwtService.verifyAsync(token);
  }

  async register(data: RegisterDto) {
    const userAlreadyExists = await this.findOneByEmail(data.email);
    if (userAlreadyExists) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'User already exists',
      });
    }

    const newUser = await this.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: bcrypt.hashSync(data.password, 10),
      },
    });
    delete newUser.password;
    return newUser;
  }

  async verify(data: VerifyDto) {
    try {
      const { id } = await this.verifyToken(data.token);
      const user = await this.findOneById(id);
      if (!user) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      delete user.password;
      return user;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
    }
  }

  async findOneByEmail(email: string) {
    return this.user.findFirst({ where: { email } });
  }

  async findOneById(id: string) {
    return this.user.findUnique({ where: { id } });
  }
}
