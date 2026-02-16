import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) { }

    async create(agencyId: string | null, data: {
        action: string;
        entity?: string;
        entityId?: string;
        details?: string;
        severity?: string;
        metadata?: any;
    }, userId?: string) {
        let finalAgencyId = agencyId;

        if (!finalAgencyId) {
            // Find system agency for platform-level logs
            const systemAgency = await this.prisma.agency.findUnique({
                where: { slug: 'system' }
            });
            if (systemAgency) {
                finalAgencyId = systemAgency.id;
            } else {
                console.warn('SYSTEM agency not found for platform audit log');
                // Could create it here or fallback if schema allows null (needs restart)
                // For now, let it fail or try to proceed if schema was updated but not client?
                // But client validation will fail if field is required.
                // We must provide a string.
            }
        }

        return this.prisma.auditLog.create({
            data: {
                ...data,
                agencyId: finalAgencyId!, // Assert non-null if we expect it to be handled
                userId: userId || null,
            },
        });
    }

    async findAll(agencyId: string) {
        return this.prisma.auditLog.findMany({
            where: { agencyId },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        role: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
