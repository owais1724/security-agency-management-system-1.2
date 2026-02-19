
import { Controller, Request, Post, UseGuards, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req, @Res({ passthrough: true }) response: Response) {
        const { access_token, user } = await this.authService.login(req.user);

        const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT !== undefined;
        response.cookie('access_token', access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return { ...user, access_token };
    }


    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(@Request() req, @Res({ passthrough: true }) response: Response) {
        // Log the logout event
        if (req.user) {
            await this.authService.logLogout(req.user);
        }

        const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT !== undefined;
        response.clearCookie('access_token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        return { message: 'Logged out successfully' };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getMe(@Request() req) {
        const user = await this.usersService.findOneWithPermissions(req.user.email);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName || 'Unknown',
            role: user.role,
            permissions: user.role?.permissions?.map((p: any) => p.action) || [],
            agencyId: user.agencyId,
            agencySlug: user.agency?.slug,
            employeeId: user.employeeId
        };
    }
}

