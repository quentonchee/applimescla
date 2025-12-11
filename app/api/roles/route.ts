import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_ROLES"))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const roles = await prisma.role.findMany({
            orderBy: { name: "asc" },
        });

        const parsedRoles = roles.map(role => ({
            ...role,
            permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
        }));

        return NextResponse.json(parsedRoles);
    } catch (error) {
        console.error("Failed to fetch roles", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && !session.user.roles?.includes("ADMIN") && !session.user.permissions?.includes("MANAGE_ROLES"))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, permissions } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const role = await prisma.role.create({
            data: {
                name,
                permissions: JSON.stringify(permissions || []),
            },
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error("Failed to create role", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
