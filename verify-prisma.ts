import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Prisma Client models...');

    // Check if AttendanceHistory model exists in the client
    if ('attendanceHistory' in prisma) {
        console.log('✅ AttendanceHistory model found in Prisma Client');
    } else {
        console.error('❌ AttendanceHistory model NOT found in Prisma Client');
        // Log available keys to see what's there
        console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
    }

    // Check if Event model has isClosed field (by checking types or creating a dummy query)
    // We can't easily check types at runtime, but we can try a query
    try {
        const event = await prisma.event.findFirst({
            select: { id: true, isClosed: true }
        });
        console.log('✅ Event.isClosed field query successful');
    } catch (error) {
        console.error('❌ Event.isClosed field query failed:', error);
    }

    // Check if User model has instrument field
    try {
        const user = await prisma.user.findFirst({
            select: { id: true, instrument: true }
        });
        console.log('✅ User.instrument field query successful');
    } catch (error) {
        console.error('❌ User.instrument field query failed:', error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
