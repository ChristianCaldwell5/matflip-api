import { Body, Controller, Post, BadRequestException, Req, Res, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/services/users.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

    @Post('/google')
    async googleAuthCallback(@Body() reqBody: any, @Req() req: Request, @Res() res: Response) {
        const credential = reqBody?.credential ?? null;
        if (!credential) {
            throw new BadRequestException('Missing credentials');
        }
        // CSRF token check
        const cookieCsrf = (req as any).cookies?.['g_csrf_token'];
        const bodyCsrf = reqBody?.g_csrf_token;
        if (!cookieCsrf || !bodyCsrf || cookieCsrf !== bodyCsrf) {
            throw new BadRequestException('Invalid CSRF token');
        }

        // Verify the ID token with Google
        const payload = await this.authService.verifyGoogleIdToken(credential);

        // Upsert user by email (atomic) and fetch the user document
        let appUser: any | null = null;
        if (payload.email) {
            try {
                const newUserProfile = this.usersService.generateNewUserProfile(
                    payload.email,
                    payload.name,
                    payload.picture,
                    payload.sub
                );
                appUser = await this.usersService.upsertByEmail(payload.email, newUserProfile);
            } catch (err) {
                console.error('Error upserting user:', err);
                throw new BadRequestException('Error processing user');
            }
        }
        console.log('App user after upsert:', appUser);
        if (!appUser) {
            throw new BadRequestException('User provisioning failed');
        }

        // Create our session token with internal user id and minimal hints
        const session = this.authService.signSession({
            sub: String(appUser._id),
            email: appUser.email,
            email_verified: payload.email_verified!,
            name: appUser.name,
            picture: appUser.avatarUrl,
        });

        const cookieDomain = process.env.COOKIE_DOMAIN;
        res.cookie('mf_session', session, {
            httpOnly: true,
            secure: true, // required for SameSite=None in modern browsers
            sameSite: 'none',
            domain: cookieDomain || undefined,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to UI; do not include tokens or PII in query
        const uiBase = process.env.UI_BASE_URL || 'http://localhost:4200';
        return res.redirect(302, `${uiBase}/login`);
    }

}
