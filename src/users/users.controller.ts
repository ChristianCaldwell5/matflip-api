import { Controller, Get, BadRequestException, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('retrieve')
  async retrieve(@Req() req: Request) {
    const token = (req as any).cookies?.['session'];
    if (!token) {
      throw new BadRequestException('Missing session');
    }
    const claims = this.authService.verifySession(token);
    const userId = claims.sub as string | undefined;
    if (!userId) {
      throw new BadRequestException('Invalid session');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      picture: user.avatarUrl,
      email_verified: !!claims.email_verified,
    };
  }
}
