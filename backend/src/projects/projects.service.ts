import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async create(agencyId: string, data: any) {
        // Validate client belongs to this agency
        if (data.clientId) {
            const client = await this.prisma.client.findFirst({
                where: { id: data.clientId, agencyId }
            });
            if (!client) throw new Error('Unauthorized client selection');
        }

        return this.prisma.project.create({
            data: {
                ...data,
                agencyId,
            },
        });
    }

    async findAll(agencyId: string) {
        if (!agencyId) return [];
        return this.prisma.project.findMany({
            where: { agencyId },
            include: {
                client: true,
            },
        });
    }
}
