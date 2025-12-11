import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = await prisma.role.findUnique({
            where: { id },
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...role,
            permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
        });
    } catch (error) {
        console.error("Failed to fetch role", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, permissions } = await req.json();

        const role = await prisma.role.update({
            where: { id },
            data: {
                name,
                permissions: JSON.stringify(permissions || []),
            },
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error("Failed to update role", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.role.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Role deleted" });
    } catch (error) {
        console.error("Failed to delete role", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
