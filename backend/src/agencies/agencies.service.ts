import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgenciesService {
    private readonly logger = new Logger(AgenciesService.name);
    constructor(private prisma: PrismaService) { }

    async createAgency(data: {
        name: string;
        slug: string;
        adminEmail: string;
        adminPassword: string;
        adminName: string;
    }) {
        const existingAgency = await this.prisma.agency.findUnique({
            where: { slug: data.slug },
        });
        if (existingAgency) throw new ConflictException('Agency slug already exists');

        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.adminEmail },
        });
        if (existingUser) throw new ConflictException('Admin email already in use');

        return this.prisma.$transaction(async (tx) => {
            const agency = await tx.agency.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                },
            });

            const adminRole = await tx.role.create({
                data: {
                    name: 'Agency Admin',
                    description: 'Full control of the agency',
                    isSystem: true,
                    agencyId: agency.id,
                    permissions: {
                        connect: await tx.permission.findMany({
                            where: {
                                action: {
                                    notIn: [
                                        'create_agency', 'edit_agency', 'delete_agency',
                                        'create_agency_admin', 'view_platform_analytics'
                                    ]
                                }
                            }
                        }).then(perms => perms.map(p => ({ id: p.id })))
                    }
                },
            });

            const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
            await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    fullName: data.adminName,
                    agencyId: agency.id,
                    roleId: adminRole.id,
                },
            });

            return agency;
        });
    }

    async findAll() {
        return this.prisma.agency.findMany();
    }

    async remove(id: string) {
        const agency = await this.prisma.agency.findUnique({ where: { id } });
        if (!agency) throw new NotFoundException('Agency not found');

        this.logger.log(`Starting deletion of agency: ${agency.name} (${id})`);

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Helper to safely delete - skips if table doesn't exist (P2021)
                const safeDelete = async (label: string, fn: () => Promise<any>) => {
                    try {
                        const result = await fn();
                        this.logger.log(`  [OK] ${label}: ${result?.count ?? 'done'}`);
                        return result;
                    } catch (err: any) {
                        if (err?.code === 'P2021') {
                            this.logger.warn(`  [SKIP] ${label}: table not found`);
                            return null;
                        }
                        this.logger.error(`  [FAIL] ${label}: ${err.code} - ${err.message}`);
                        throw err;
                    }
                };

                // 1. Leaf tables (nothing references these)
                await safeDelete('Attendance', () => tx.attendance.deleteMany({ where: { agencyId: id } }));
                await safeDelete('Leave', () => tx.leave.deleteMany({ where: { agencyId: id } }));
                await safeDelete('Payroll', () => tx.payroll.deleteMany({ where: { agencyId: id } }));
                await safeDelete('Visitor', () => tx.visitor.deleteMany({ where: { agencyId: id } }));
                await safeDelete('AuditLog', () => tx.auditLog.deleteMany({ where: { agencyId: id } }));

                // 2. Checkpoints (references Project)
                await safeDelete('Checkpoint', () =>
                    tx.checkpoint.deleteMany({ where: { project: { agencyId: id } } })
                );

                // 3. Disconnect Employee <-> Project many-to-many
                const employees = await tx.employee.findMany({
                    where: { agencyId: id },
                    select: { id: true }
                });
                this.logger.log(`  Found ${employees.length} employees to disconnect`);
                for (const emp of employees) {
                    await safeDelete(`Emp-Project ${emp.id}`, () =>
                        tx.employee.update({
                            where: { id: emp.id },
                            data: { assignedProjects: { set: [] } }
                        })
                    );
                }

                // 4. Disconnect Role <-> Permission many-to-many
                const roles = await tx.role.findMany({
                    where: { agencyId: id },
                    select: { id: true }
                });
                this.logger.log(`  Found ${roles.length} roles to disconnect`);
                for (const role of roles) {
                    await safeDelete(`Role-Perm ${role.id}`, () =>
                        tx.role.update({
                            where: { id: role.id },
                            data: { permissions: { set: [] } }
                        })
                    );
                }

                // 5. Users (references Role via roleId, Employee via employeeId)
                await safeDelete('User', () => tx.user.deleteMany({ where: { agencyId: id } }));

                // 6. Employees (references Designation via designationId)
                await safeDelete('Employee', () => tx.employee.deleteMany({ where: { agencyId: id } }));

                // 7. Projects (references Client via clientId)
                await safeDelete('Project', () => tx.project.deleteMany({ where: { agencyId: id } }));

                // 8. Now safe to delete Client, Designation, Role
                await safeDelete('Client', () => tx.client.deleteMany({ where: { agencyId: id } }));
                await safeDelete('Designation', () => tx.designation.deleteMany({ where: { agencyId: id } }));
                await safeDelete('Role', () => tx.role.deleteMany({ where: { agencyId: id } }));

                // 9. Finally delete the Agency itself
                const deleted = await tx.agency.delete({ where: { id } });
                this.logger.log(`Agency "${agency.name}" deleted successfully`);
                return deleted;
            });
        } catch (error: any) {
            this.logger.error(`Agency deletion failed: [${error.code}] ${error.message}`, error.stack);
            throw new InternalServerErrorException(
                `Failed to delete agency: ${error.code || 'UNKNOWN'} - ${error.message}`
            );
        }
    }
}
