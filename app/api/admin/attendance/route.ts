import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const attendance = await prisma.attendance.findMany({
        include: {
            user: {
                select: { name: true, email: true },
            },
            event: {
                select: { title: true, date: true },
            },
        },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(attendance);
}
