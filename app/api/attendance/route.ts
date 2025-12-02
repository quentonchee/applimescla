import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { eventId, status } = await req.json();

        if (!eventId || !["PRESENT", "ABSENT"].includes(status)) {
            return new NextResponse("Invalid data", { status: 400 });
        }

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return new NextResponse("Event not found", { status: 404 });
        if (event.isClosed) return new NextResponse("Inscriptions closes", { status: 403 });

        // Update attendance and create history log in a transaction
        console.log(`Updating attendance for user ${session.user.id} event ${eventId} to ${status}`);
        const result = await prisma.$transaction([
            prisma.attendance.upsert({
                where: {
                    userId_eventId: {
                        userId: session.user.id,
                        eventId,
                    },
                },
                update: { status },
                create: {
                    userId: session.user.id,
                    eventId,
                    status,
                },
            }),
            prisma.attendanceHistory.create({
                data: {
                    userId: session.user.id,
                    eventId,
                    status,
                },
            }),
        ]);
        console.log("Attendance updated successfully");

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Error in attendance route:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch events with user's attendance
    const events = await prisma.event.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        include: {
            attendances: {
                where: { userId: session.user.id },
            },
        },
    });

    const eventsWithStatus = events.map((event: any) => ({
        ...event,
        userStatus: event.attendances[0]?.status || null,
    }));

    return NextResponse.json(eventsWithStatus);
}
