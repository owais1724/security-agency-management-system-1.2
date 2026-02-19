import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<any> {
        const normalizedEmail = email?.toLowerCase().trim();
        return this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
                agency: true,
            },
        });
    }


    async findOneWithPermissions(email: string): Promise<any> {
        const normalizedEmail = email?.toLowerCase().trim();
        return this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
                agency: true,
            },
        });
    }


    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
                agency: true,
            },
        });
    }
}
