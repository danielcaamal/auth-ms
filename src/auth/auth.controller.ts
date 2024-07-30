import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: LoginDto) {
    return this.authService.login(data);
  }

  @MessagePattern({ cmd: 'register_user' })
  async register(@Payload() data: RegisterDto) {
    return this.authService.register(data);
  }

  @MessagePattern({ cmd: 'verify_user' })
  async verify(@Payload() data: VerifyDto) {
    return this.authService.verify(data);
  }
}
