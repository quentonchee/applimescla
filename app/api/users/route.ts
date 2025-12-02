import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_USERS"))) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { name, email, password, role, instrument, roles } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare roles connection
        let rolesConnect: { id: string }[] = [];
        if (roles && Array.isArray(roles)) {
            rolesConnect = roles.map((roleId: string) => ({ id: roleId }));
        } else if (role === "ADMIN") {
            // Fallback for backward compatibility or simple UI
            // Ideally we should look up the ADMIN role ID, but for now we might rely on the deprecated field
            // or assume the UI sends role IDs.
            // If we want to auto-assign based on the string "ADMIN", we'd need to find that role first.
            // For now, let's trust the 'roles' array if provided, otherwise just set the deprecated field.
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "USER", // Deprecated
                instrument,
                mustChangePassword: true,
                roles: {
                    connect: rolesConnect,
                },
            },
            include: { roles: true },
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_USERS"))) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: { roles: true },
    });

    return NextResponse.json(users);
}
