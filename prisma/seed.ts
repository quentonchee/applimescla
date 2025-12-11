import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('admin123', 10)

    // Create ADMIN role if it doesn't exist
    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
            name: 'ADMIN',
            permissions: JSON.stringify(['VIEW_ADMIN', 'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_EVENTS', 'VIEW_ATTENDANCE'])
        }
    })

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
            password,
            roles: {
                connect: { id: adminRole.id }
            }
        },
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password,
            role: 'ADMIN', // Legacy field
            roles: {
                connect: { id: adminRole.id }
            },
            mustChangePassword: false,
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
