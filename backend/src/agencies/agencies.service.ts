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
            const user = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    fullName: data.adminName,
                    agencyId: agency.id,
                    roleId: adminRole.id,
                },
            });

            // Create a default "Director" designation for the admin
            const designation = await tx.designation.create({
                data: {
                    name: 'Director',
                    agencyId: agency.id,
                }
            });

            // Create an Employee record for the admin so they can use employee features (like Leaves)
            const employee = await tx.employee.create({
                data: {
                    code: 'ADM001',
                    fullName: data.adminName,
                    email: data.adminEmail,
                    agencyId: agency.id,
                    userId: user.id,
                    designationId: designation.id,
                    address: 'Agency HQ',
                    phone: '0000000000',
                    joiningDate: new Date(),
                }
            });

            // Link the user back to the employee
            await tx.user.update({
                where: { id: user.id },
                data: { employeeId: employee.id }
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

        // Helper to safely delete - skips if table doesn't exist (P2021)
        const safeDelete = async (label: string, fn: () => Promise<any>) => {
            try {
                const result = await fn();
                this.logger.log(`  [OK] ${label}: ${result?.count ?? 'done'}`);
                return result;
            } catch (err: any) {
                if (err.code === 'P2021') { // Table does not exist
                    this.logger.warn(`  [SKIP] ${label}: table not found`);
                    return null;
                }
                // Log but don't throw yet, try to continue cleaning up other parts
                this.logger.error(`  [FAIL] ${label}: ${err.code} - ${err.message}`);
                return null;
            }
        };

        try {
            // 1. Leaf tables (nothing references these)
            await safeDelete('Attendance', () => this.prisma.attendance.deleteMany({ where: { agencyId: id } }));
            await safeDelete('Leave', () => this.prisma.leave.deleteMany({ where: { agencyId: id } }));
            await safeDelete('Payroll', () => this.prisma.payroll.deleteMany({ where: { agencyId: id } }));
            await safeDelete('Visitor', () => this.prisma.visitor.deleteMany({ where: { agencyId: id } }));

            // AuditLog references User (onDelete: SetNull), so we can delete it anytime, but best to do it early
            await safeDelete('AuditLog', () => this.prisma.auditLog.deleteMany({ where: { agencyId: id } }));

            // 2. Checkpoints (references Project)
            // This is likely where it was failing if the table didn't exist
            await safeDelete('Checkpoint', () =>
                this.prisma.checkpoint.deleteMany({ where: { project: { agencyId: id } } })
            );

            // 3. Disconnect Employee <-> Project many-to-many
            const employees = await this.prisma.employee.findMany({
                where: { agencyId: id },
                select: { id: true }
            });
            if (employees.length > 0) {
                this.logger.log(`  Cleaning up projects for ${employees.length} employees...`);
                for (const emp of employees) {
                    await safeDelete(`Emp-Project ${emp.id}`, () =>
                        this.prisma.employee.update({
                            where: { id: emp.id },
                            data: { assignedProjects: { set: [] } }
                        })
                    );
                }
            }

            // 4. Disconnect Role <-> Permission many-to-many
            const roles = await this.prisma.role.findMany({
                where: { agencyId: id },
                select: { id: true }
            });
            if (roles.length > 0) {
                this.logger.log(`  Cleaning up permissions for ${roles.length} roles...`);
                for (const role of roles) {
                    await safeDelete(`Role-Perm ${role.id}`, () =>
                        this.prisma.role.update({
                            where: { id: role.id },
                            data: { permissions: { set: [] } }
                        })
                    );
                }
            }

            // 5. Users (references Role via roleId, Employee via employeeId)
            // These must go before Role and Employee
            await safeDelete('User', () => this.prisma.user.deleteMany({ where: { agencyId: id } }));

            // 6. Employees (references Designation via designationId)
            // Must go before Designation
            await safeDelete('Employee', () => this.prisma.employee.deleteMany({ where: { agencyId: id } }));

            // 7. Projects (references Client via clientId)
            // Must go before Client
            await safeDelete('Project', () => this.prisma.project.deleteMany({ where: { agencyId: id } }));

            // 8. Remaining entities
            await safeDelete('Client', () => this.prisma.client.deleteMany({ where: { agencyId: id } }));
            await safeDelete('Designation', () => this.prisma.designation.deleteMany({ where: { agencyId: id } }));
            await safeDelete('Role', () => this.prisma.role.deleteMany({ where: { agencyId: id } }));

            // 9. Finally delete the Agency itself
            // This is the only step that really strictly matters for "success"
            const deleted = await this.prisma.agency.delete({ where: { id } });

            this.logger.log(`Agency "${agency.name}" deleted successfully`);
            return deleted;

        } catch (error: any) {
            this.logger.error(`Agency deletion failed: [${error.code}] ${error.message}`, error.stack);
            throw new InternalServerErrorException(
                `Failed to delete agency: ${error.code || 'UNKNOWN'} - ${error.message}`
            );
        }
    }
}
