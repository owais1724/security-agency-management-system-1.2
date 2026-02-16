import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
    constructor(
        private prisma: PrismaService,
        private auditLogsService: AuditLogsService
    ) { }

    private logError(error: any) {
        fs.appendFileSync('backend_errors.log', `${new Date().toISOString()} - EMP_SVC: ${error.stack || error.message}\n`);
    }

    async create(agencyId: string, data: CreateEmployeeDto) {
        console.log('Received payload for creation:', JSON.stringify(data, null, 2));
        try {
            // 1. Check if user email exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingUser) throw new ConflictException('Email already registered');

            // 2. Get the designation to use as role name
            const designation = await this.prisma.designation.findUnique({
                where: { id: data.designationId }
            });

            if (!designation) {
                throw new ConflictException('Invalid designation selected');
            }

            // 3. Find or create a role with the same name as the designation
            let role = await this.prisma.role.findFirst({
                where: {
                    name: designation.name,
                    agencyId: agencyId
                }
            });

            if (!role) {
                // Ensure essential permissions exist
                const essentialActions = ['mark_attendance', 'apply_leave', 'view_projects'];
                for (const action of essentialActions) {
                    await this.prisma.permission.upsert({
                        where: { action },
                        update: {},
                        create: { action, description: `Auto-created for ${action}` }
                    });
                }

                // Create a new role with the designation name and essential permissions
                role = await this.prisma.role.create({
                    data: {
                        name: designation.name,
                        description: `Auto-generated role for ${designation.name}`,
                        agencyId: agencyId,
                        isSystem: false,
                        permissions: {
                            connect: essentialActions.map(action => ({ action }))
                        }
                    }
                });
            }

            // 4. Transactional creation of Employee + User
            return await this.prisma.$transaction(async (tx) => {
                const normalizedEmail = data.email.toLowerCase().trim();
                const hashedPassword = await bcrypt.hash(data.password, 10);

                // Create Employee Record First
                const employee = await tx.employee.create({
                    data: {
                        fullName: data.fullName,
                        employeeCode: data.employeeCode,
                        email: normalizedEmail,
                        phoneNumber: data.phoneNumber,
                        status: 'ACTIVE',
                        basicSalary: data.basicSalary || 0,
                        agencyId: agencyId,
                        designationId: data.designationId,
                    },
                });

                // Create User Account and Link to Employee
                await tx.user.create({
                    data: {
                        email: normalizedEmail,
                        password: hashedPassword,
                        fullName: data.fullName,
                        agencyId: agencyId,
                        roleId: role.id,
                        employeeId: employee.id,
                    },
                });

                return employee;
            });
        } catch (error: any) {
            console.error('Create Employee Error:', error);
            this.logError(error);

            if (error instanceof ConflictException) throw error;

            // Handle Prisma Unique Constraint Violation
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target?.includes('email')) {
                    throw new ConflictException('Email address is already in use.');
                }
                if (target?.includes('employeeCode')) {
                    throw new ConflictException('Staff ID / Employee Code is already in use.');
                }
                throw new ConflictException(`${target} already exists.`);
            }

            throw new InternalServerErrorException(`Failed to create personnel: ${error.message}`);
        }
    }

    async findAll(agencyId: string) {
        if (!agencyId) return [];
        try {
            return await this.prisma.employee.findMany({
                where: { agencyId },
                include: {
                    user: {
                        select: {
                            fullName: true,
                            email: true,
                            role: true,
                        }
                    },
                    designation: true,
                    assignedProjects: true,
                },
            });
        } catch (e) {
            this.logError(e);
            throw e;
        }
    }

    async remove(agencyId: string, id: string, userId?: string) {
        try {
            // Find employee first to get name for logs
            const employee = await this.prisma.employee.findUnique({
                where: { id, agencyId }
            });

            if (!employee) throw new ConflictException('Personnel record not found.');

            await this.prisma.employee.delete({
                where: { id, agencyId }
            });

            // Log the action
            await this.auditLogsService.create(agencyId, {
                action: 'TERMINATE_PERSONNEL',
                details: `Personnel ${employee.fullName} (${employee.employeeCode}) was terminated and record expunged.`,
                severity: 'CRITICAL',
                entity: 'Employee',
                entityId: id
            }, userId);

            return { success: true };
        } catch (error) {
            this.logError(error);
            if (error instanceof ConflictException) throw error;
            throw new InternalServerErrorException('Failed to terminate personnel record. Please check for active assignments.');
        }
    }
}
