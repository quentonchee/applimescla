import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                instrument: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Fetch all events and this user's attendance for each
        const events = await prisma.event.findMany({
            orderBy: { date: "desc" },
            include: {
                attendances: {
                    where: { userId: id },
                    select: { status: true, updatedAt: true },
                },
            },
        });

        // Format the response
        const history = events.map((event) => ({
            eventId: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            status: event.attendances[0]?.status || "NO_RESPONSE",
        }));

        // Calculate stats
        const totalEvents = events.length;
        const presentCount = history.filter(h => h.status === "PRESENT").length;
        const absentCount = history.filter(h => h.status === "ABSENT").length;
        const noResponseCount = history.filter(h => h.status === "NO_RESPONSE").length;

        return NextResponse.json({
            user,
            history,
            stats: {
                totalEvents,
                presentCount,
                absentCount,
                noResponseCount,
                participationRate: totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0
            }
        });

    } catch (error) {
        console.error("Failed to fetch user history", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
