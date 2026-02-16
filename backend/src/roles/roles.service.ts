import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    private logError(error: any) {
        fs.appendFileSync('backend_errors.log', `${new Date().toISOString()} - ${error.stack || error.message}\n`);
    }

    async findAllPermissions() {
        try {
            return await this.prisma.permission.findMany({
                orderBy: { action: 'asc' }
            });
        } catch (e) {
            this.logError(e);
            throw e;
        }
    }

    async findAllRoles(agencyId: string) {
        try {
            return await this.prisma.role.findMany({
                where: {
                    OR: [
                        { agencyId: agencyId },
                        { agencyId: null, isSystem: true } // System roles like 'Super Admin', though maybe not needed for agency
                    ]
                },
                include: {
                    permissions: true,
                    _count: {
                        select: { users: true }
                    }
                }
            });
        } catch (e) {
            this.logError(e);
            throw e;
        }
    }

    async createRole(agencyId: string, data: { name: string; description?: string; permissionIds: string[] }) {
        return this.prisma.role.create({
            data: {
                name: data.name,
                description: data.description,
                agencyId,
                isSystem: false,
                permissions: {
                    connect: data.permissionIds.map(id => ({ id }))
                }
            },
            include: { permissions: true }
        });
    }

    async updateRole(agencyId: string, roleId: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role || (role.agencyId !== agencyId && role.agencyId !== null)) {
            throw new NotFoundException('Role not found');
        }

        // For system roles, only allow permission updates, not name/description changes
        if (role.isSystem) {
            if (data.name || data.description) {
                throw new ForbiddenException('Cannot modify system role name or description');
            }
            // Allow permission updates for system roles
            return this.prisma.role.update({
                where: { id: roleId },
                data: {
                    permissions: data.permissionIds ? {
                        set: data.permissionIds.map(id => ({ id }))
                    } : undefined
                },
                include: { permissions: true }
            });
        }

        // For custom roles, allow all updates
        return this.prisma.role.update({
            where: { id: roleId },
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissionIds ? {
                    set: data.permissionIds.map(id => ({ id }))
                } : undefined
            },
            include: { permissions: true }
        });
    }

    async removeRole(agencyId: string, roleId: string) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: { _count: { select: { users: true } } }
        });

        if (!role || role.agencyId !== agencyId) {
            throw new NotFoundException('Role not found');
        }
        if (role.isSystem) {
            throw new ForbiddenException('Cannot delete system roles');
        }
        if (role._count.users > 0) {
            throw new ForbiddenException('Cannot delete role with assigned users');
        }

        return this.prisma.role.delete({ where: { id: roleId } });
    }
}
