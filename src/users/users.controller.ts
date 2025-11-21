import { Controller, Get, BadRequestException, Req, NotFoundException, UnauthorizedException, Param, Headers, Post, Res } from '@nestjs/common';
import { Response, Request } from 'express';
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

    /**
     * Get User info from session cookie
     * @param req request containing session cookie
     * @returns User info
     */
    @Get('retrieve')
    async retrieve(@Req() req: Request) {
        const token = (req as any).cookies?.['mf_session'];
        if (!token) {
            throw new BadRequestException('Missing session');
        }
        const claims = this.authService.verifySession(token);
        const userId = claims.sub as string | undefined;
        if (!userId) {
            throw new BadRequestException('Invalid session');
        }
        const user = await this.usersService.findByUserId(userId);
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

    /**
     * Get User info by ID (for internal use)
     * @param req request containing user ID param and secret header
     * @returns User info
     */
    @Get(':id')
    async getByGoogleId(@Param('id') id: string, @Headers('x-mat-flip-request') secureHeader?: string) {
        if (secureHeader !== process.env.MAT_FLIP_X_HEADER) {
            throw new UnauthorizedException('YOU SHOULD NOT BE HERE >:(');
        }
        // verify user session cookie
        const user = await this.usersService.findByGoogleId(id);
        if (!user) {
            throw new NotFoundException('There was no user matching the given Google ID');
        }
        return user;
    }

    @Post('/logout')
    async logout(@Req() req: Request, @Res() res: Response) {
        const cookieDomain = process.env.COOKIE_DOMAIN;
        res.clearCookie('mf_session', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            domain: cookieDomain || undefined});
        return res.status(200).send({ ok: true });
    }
}
