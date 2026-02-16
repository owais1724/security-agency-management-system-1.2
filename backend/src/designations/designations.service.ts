import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DesignationsService {
    constructor(private prisma: PrismaService) { }

    async create(agencyId: string, data: { name: string; description?: string }) {
        return this.prisma.designation.create({
            data: {
                ...data,
                agencyId,
            },
        });
    }

    async findAll(agencyId: string) {
        if (!agencyId) return [];
        return this.prisma.designation.findMany({
            where: { agencyId },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });
    }

    async remove(agencyId: string, id: string) {
        return this.prisma.designation.delete({
            where: { id, agencyId },
        });
    }
}
