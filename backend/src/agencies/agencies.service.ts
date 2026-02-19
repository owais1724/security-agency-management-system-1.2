import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgenciesService {
    constructor(private prisma: PrismaService) { }

    async createAgency(data: {
        name: string;
        slug: string;
        adminEmail: string;
        adminPassword: string;
        adminName: string;
    }) {
        // 1. Check if agency exists
        const existingAgency = await this.prisma.agency.findUnique({
            where: { slug: data.slug },
        });
        if (existingAgency) throw new ConflictException('Agency slug already exists');

        // 2. Check if admin user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.adminEmail },
        });
        if (existingUser) throw new ConflictException('Admin email already in use');

        // 3. Create Agency
        return this.prisma.$transaction(async (tx) => {
            const agency = await tx.agency.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                },
            });

            // 4. Create Agency Admin Role for this agency
            const adminRole = await tx.role.create({
                data: {
                    name: 'Agency Admin',
                    description: 'Full control of the agency',
                    isSystem: true,
                    agencyId: agency.id,
                    // Connect all operational permissions to this role
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

            // 5. Create Admin User
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
        // Check if agency exists
        const agency = await this.prisma.agency.findUnique({ where: { id } });
        if (!agency) throw new NotFoundException('Agency not found');

        // Use transaction to clean up all related data in correct FK order
        return this.prisma.$transaction(async (tx) => {
            // 1. Leaf tables (no other tables reference these)
            await tx.attendance.deleteMany({ where: { agencyId: id } });
            await tx.leave.deleteMany({ where: { agencyId: id } });
            await tx.payroll.deleteMany({ where: { agencyId: id } });
            await tx.visitor.deleteMany({ where: { agencyId: id } });

            // 2. Audit logs (references User via userId, but onDelete: SetNull)
            await tx.auditLog.deleteMany({ where: { agencyId: id } });

            // 3. Checkpoints (references Project)
            await tx.checkpoint.deleteMany({
                where: { project: { agencyId: id } }
            });

            // 4. Disconnect EmployeeToProject many-to-many relations
            const employees = await tx.employee.findMany({
                where: { agencyId: id },
                select: { id: true }
            });
            for (const emp of employees) {
                await tx.employee.update({
                    where: { id: emp.id },
                    data: { assignedProjects: { set: [] } }
                });
            }

            // 5. Disconnect PermissionToRole many-to-many relations
            const roles = await tx.role.findMany({
                where: { agencyId: id },
                select: { id: true }
            });
            for (const role of roles) {
                await tx.role.update({
                    where: { id: role.id },
                    data: { permissions: { set: [] } }
                });
            }

            // 6. Users FIRST (User references Role via roleId, Employee via employeeId)
            await tx.user.deleteMany({ where: { agencyId: id } });

            // 7. Employees (Employee references Designation via designationId)
            await tx.employee.deleteMany({ where: { agencyId: id } });

            // 8. Projects (Project references Client via clientId)
            await tx.project.deleteMany({ where: { agencyId: id } });

            // 9. Now safe to delete Client, Designation, Role
            await tx.client.deleteMany({ where: { agencyId: id } });
            await tx.designation.deleteMany({ where: { agencyId: id } });
            await tx.role.deleteMany({ where: { agencyId: id } });

            // 10. Finally delete the Agency itself
            return tx.agency.delete({ where: { id } });
        });
    }
}
