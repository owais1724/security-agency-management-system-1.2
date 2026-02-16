import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Permissions
    const allPermissions = [
        // Platform Level
        'create_agency', 'edit_agency', 'delete_agency',
        'create_agency_admin',
        'view_platform_analytics',

        // Agency Level - Operational
        'view_clients', 'create_client', 'edit_client', 'delete_client',
        'view_projects', 'create_project', 'edit_project', 'delete_project',
        'view_personnel', 'create_personnel', 'edit_personnel', 'delete_personnel',
        'manage_roles', // Create/Edit roles
        'assign_staff',
        'view_attendance', 'mark_attendance',
        'approve_leave', 'apply_leave', 'view_leaves',
        'manage_payroll', 'view_payroll',
        'view_reports'
    ];

    for (const action of allPermissions) {
        await prisma.permission.upsert({
            where: { action },
            update: {},
            create: { action },
        });
    }

    // 2. Create System Roles (agencyId is null)

    // 2a. Super Admin (Platform Owner)
    const platformPermissions = await prisma.permission.findMany({
        where: {
            action: {
                in: ['create_agency', 'edit_agency', 'delete_agency', 'create_agency_admin', 'view_platform_analytics']
            }
        }
    });

    await prisma.role.upsert({
        where: { id: 'super-admin-role' },
        update: {
            permissions: {
                set: platformPermissions.map(p => ({ id: p.id }))
            }
        },
        create: {
            id: 'super-admin-role',
            name: 'Super Admin',
            description: 'Platform Owner',
            isSystem: true,
            permissions: {
                connect: platformPermissions.map(p => ({ id: p.id }))
            }
        },
    });

    // 2b. Basic Staff (Operational User)
    const staffPermissions = await prisma.permission.findMany({
        where: {
            action: {
                in: ['mark_attendance', 'apply_leave']
            }
        }
    });

    await prisma.role.upsert({
        where: { id: 'system-staff-role' },
        update: {
            permissions: {
                set: staffPermissions.map(p => ({ id: p.id }))
            }
        },
        create: {
            id: 'system-staff-role',
            name: 'Staff',
            description: 'Default operational staff role',
            isSystem: true,
            permissions: {
                connect: staffPermissions.map(p => ({ id: p.id }))
            }
        },
    });

    // 3. Create Super Admin User
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash('password123', salt);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@sams.com' },
        update: {
            roleId: 'super-admin-role'
        },
        create: {
            email: 'admin@sams.com',
            password,
            fullName: 'Platform Super Admin',
            roleId: 'super-admin-role',
        }
    });

    console.log('Seeding complete. Super Admin created:', superAdmin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
