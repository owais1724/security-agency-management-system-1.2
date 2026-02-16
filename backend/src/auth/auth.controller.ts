
import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
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
    async login(@Request() req) {
        return this.authService.login(req.user);
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
            role: user.role?.name || 'No Role',
            permissions: user.role?.permissions?.map((p: any) => p.action) || [],
            agencyId: user.agencyId,
            agencySlug: user.agency?.slug,
            employeeId: user.employeeId
        };
    }
}

