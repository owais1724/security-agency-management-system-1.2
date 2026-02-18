
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private auditLogsService: AuditLogsService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.usersService.findOne(normalizedEmail);

        if (!user) {
            console.log(`[AuthService] No user found with email: "${normalizedEmail}"`);
            return null;
        }

        const isPasswordMatching = await bcrypt.compare(pass, user.password);
        if (!isPasswordMatching) {
            console.log(`[AuthService] Password mismatch for email: "${normalizedEmail}"`);
            return null;
        }

        // Production Grade Check: Verify if the agency is operational
        if (user.agencyId && !user.agency?.isActive) {
            throw new UnauthorizedException('Your security agency portal has been suspended. Please contact the platform administrator.');
        }

        console.log(`[AuthService] Validation successful for: "${normalizedEmail}"`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
    }

    async login(user: any) {
        // Fetch user with role and permissions
        const userWithPermissions = await this.usersService.findOneWithPermissions(user.email);

        const payload = {
            email: userWithPermissions.email,
            sub: userWithPermissions.id,
            agencyId: userWithPermissions.agencyId,
            employeeId: userWithPermissions.employeeId,
            role: userWithPermissions.role?.name,
            permissions: userWithPermissions.role?.permissions?.map((p: any) => p.action) || []
        };

        // Create audit log for login
        await this.auditLogsService.create(userWithPermissions.agencyId, {
            action: 'LOGIN',
            details: `User ${userWithPermissions.fullName} logged into the system`,
            metadata: {
                role: userWithPermissions.role?.name,
                ip: 'CLIENT_IP_PLACEHOLDER' // In a real scenario, you'd pass the actual IP
            },
            severity: 'INFO'
        }, userWithPermissions.id);

        const { password, ...userData } = userWithPermissions;

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                ...userData,
                role: userWithPermissions.role, // This is already the object
                agencySlug: userWithPermissions.agency?.slug,
                permissions: userWithPermissions.role?.permissions?.map((p: any) => p.action) || []
            }
        };
    }

    async logLogout(user: any) {
        if (!user.agencyId) return;

        await this.auditLogsService.create(user.agencyId, {
            action: 'LOGOUT',
            details: `User session terminated`,
            metadata: {
                userId: user.sub,
                email: user.email
            },
            severity: 'INFO'
        }, user.sub);
    }
}
