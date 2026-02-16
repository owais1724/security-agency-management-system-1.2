import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async findAll(agencyId: string, todayOnly: boolean, employeeId?: string) {
        if (!agencyId) return [];
        const where: any = { agencyId };

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (todayOnly) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            where.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        return this.prisma.attendance.findMany({
            where,
            include: {
                employee: {
                    include: {
                        designation: true
                    }
                },
                project: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async checkIn(agencyId: string, userId: string, data: any) {
        // Find employee associated with user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user || !user.employee) {
            throw new Error('User is not associated with an employee record');
        }

        // Validate that the project belongs to this agency
        if (data.projectId) {
            const project = await this.prisma.project.findFirst({
                where: { id: data.projectId, agencyId }
            });
            if (!project) throw new Error('Unauthorized project selection');
        }

        return this.prisma.attendance.create({
            data: {
                date: new Date(),
                checkIn: new Date(),
                status: 'PRESENT',
                method: data.method || 'WEB',
                agencyId: agencyId,
                employeeId: user.employee.id,
                projectId: data.projectId
            }
        });
    }

    async checkOut(agencyId: string, userId: string, data: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user || !user.employee) {
            throw new Error('User is not associated with an employee record');
        }

        // Find today's check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await this.prisma.attendance.findFirst({
            where: {
                employeeId: user.employee.id,
                date: {
                    gte: today
                },
                checkOut: null
            }
        });

        if (!attendance) {
            throw new Error('No active check-in found for today');
        }

        return this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: new Date()
            }
        });
    }
}
