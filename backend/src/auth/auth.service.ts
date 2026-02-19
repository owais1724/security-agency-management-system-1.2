

import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';



@Injectable()

export class AuthService {

    constructor(

        private usersService: UsersService,

        private jwtService: JwtService,

    ) { }



    async validateUser(email: string, pass: string): Promise<any> {

        const user = await this.usersService.findOne(email);

        if (user && (await bcrypt.compare(pass, user.password))) {

            // eslint-disable-next-line @typescript-eslint/no-unused-vars

            const { password, ...result } = user;

            return result;

        }

        return null;

    }



    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            agencyId: user.agencyId,
            role: user.role?.name,
            employeeId: user.employeeId
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName || 'Unknown',
                role: user.role,
                agencyId: user.agencyId,
                agencySlug: user.agency?.slug,
                employeeId: user.employeeId,
                permissions: user.role?.permissions?.map((p: any) => p.action) || []
            }
        };
    }


    async logLogout(user: any) {
        // Implementation for logging logout could go here
        console.log(`User ${user.email} logged out`);
    }



}

