import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class MigrationService {
    constructor(private prisma: PrismaService) { }

    private logError(error: any) {
        fs.appendFileSync('backend_errors.log', `${new Date().toISOString()} - MIG_SVC: ${error.stack || error.message}\n`);
    }

    async syncEmployeeRolesToDesignations(agencyId?: string) {
        try {
            // Get employees, optionally filtered by agency
            const employees = await this.prisma.employee.findMany({
                where: agencyId ? { agencyId } : {},
                include: {
                    designation: true,
                    user: {
                        include: {
                            role: true
                        }
                    }
                }
            });

            const updates: Array<{ employee: string; oldRole: string | undefined; newRole: string }> = [];

            // Pre-fetch essential permissions
            const essentialActions = ['mark_attendance', 'apply_leave', 'view_projects'];
            for (const action of essentialActions) {
                await this.prisma.permission.upsert({
                    where: { action },
                    update: {},
                    create: { action, description: `Auto-created for ${action}` }
                });
            }

            for (const employee of employees) {
                if (!employee.designation || !employee.user) continue;

                const designationName = employee.designation.name;
                const empAgencyId = employee.agencyId;

                // Find or create role with designation name (case-insensitive to avoid duplicates)
                let role = await this.prisma.role.findFirst({
                    where: {
                        name: {
                            equals: designationName,
                            mode: 'insensitive'
                        },
                        agencyId: empAgencyId
                    }
                });

                if (!role) {
                    role = await this.prisma.role.create({
                        data: {
                            name: designationName,
                            description: `Auto-generated role for ${designationName}`,
                            agencyId: empAgencyId,
                            isSystem: false,
                            permissions: {
                                connect: essentialActions.map(action => ({ action }))
                            }
                        }
                    });
                }

                // Update user's role if different
                if (employee.user.roleId !== role.id) {
                    await this.prisma.user.update({
                        where: { id: employee.user.id },
                        data: { roleId: role.id }
                    });
                    updates.push({
                        employee: employee.fullName,
                        oldRole: employee.user.role?.name,
                        newRole: role.name
                    });
                }
            }

            return {
                message: 'Migration completed',
                updatedCount: updates.length,
                updates
            };
        } catch (e) {
            this.logError(e);
            throw e;
        }
    }
}
