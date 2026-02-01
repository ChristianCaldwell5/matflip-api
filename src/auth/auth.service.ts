import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private client: OAuth2Client;

    constructor() {
        console.log(process.env)
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            // Still construct client without clientId; verifyIdToken will fail clearly if missing
            this.client = new OAuth2Client();
        } else {
            this.client = new OAuth2Client(clientId);
        }
    }

    async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
        if (!idToken) {
            throw new UnauthorizedException('Missing Google ID token');
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            // Encourage proper configuration
            throw new UnauthorizedException('Server missing GOOGLE_CLIENT_ID');
        }

        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: clientId,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new UnauthorizedException('Invalid Google ID token');
            }
            return payload;
        } catch (err) {
            throw new UnauthorizedException('Invalid Google ID token');
        }
    }

    signSession(payload: Pick<TokenPayload, 'sub' | 'email' | 'name'>): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedException('Server missing JWT_SECRET');
        }
        // Minimal user claims; adjust as needed
        return jwt.sign(
            {
                sub: payload.sub,
                email: payload.email,
                name: payload.name,
            },
            secret,
            { expiresIn: '7d' }
        );
    }

    verifySession(token: string): any {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedException('Server missing JWT_SECRET');
        }
        try {
            return jwt.verify(token, secret);
        } catch {
            throw new UnauthorizedException('Invalid session');
        }
    }
}
