import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    let token: string | null = null;
                    if (request && request.cookies && request.cookies['access_token']) {
                        token = request.cookies['access_token'];
                    }
                    if (!token && request.headers.authorization) {
                        const parts = request.headers.authorization.split(' ');
                        if (parts.length === 2 && parts[0] === 'Bearer') {
                            token = parts[1];
                        }
                    }
                    return token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: 'superuser_secret_key_change_in_production',
        });
    }

    async validate(payload: any) {
        // Return user info with permissions
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            agencyId: payload.agencyId,
            employeeId: payload.employeeId,
            permissions: payload.permissions || []
        };
    }
}
