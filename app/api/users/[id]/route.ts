import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Allow users to view their own profile, or admins to view any profile
    if (session.user.id !== id && session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_USERS")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                roles: true,
                clothingItems: true
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("Failed to fetch user", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_USERS"))) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { name, email, password, role, instrument, roles } = await req.json();

        const data: any = {
            name,
            email,
            role, // Deprecated
            instrument,
        };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        if (roles && Array.isArray(roles)) {
            data.roles = {
                set: roles.map((roleId: string) => ({ id: roleId })),
            };
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            include: { roles: true },
        });

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("Failed to update user", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_USERS"))) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        await prisma.user.delete({
            where: { id },
        });
        return new NextResponse("User deleted", { status: 200 });
    } catch (error) {
        console.error("Failed to delete user", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
