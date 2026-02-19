
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
        include: {
            role: true,
            agency: true
        }
    });

    users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`Role: ${u.role?.name}`);
        console.log(`Agency: ${u.agency?.slug}`);
        console.log('---');
    });

    console.log('\n--- ROLES ---');
    const roles = await prisma.role.findMany();
    roles.forEach(r => {
        console.log(`Name: ${r.name}, AgencyId: ${r.agencyId}, isSystem: ${r.isSystem}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
