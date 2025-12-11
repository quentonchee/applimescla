import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        console.log(`Fetching event details for id: ${id}`);
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                attendances: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                instrument: true,
                            },
                        },
                    },
                },
                attendanceHistory: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) {
            console.log(`Event not found for id: ${id}`);
            return new NextResponse("Event not found", { status: 404 });
        }

        console.log(`Event found: ${event.title}`);

        // Get all users to calculate "No Response"
        const allUsers = await prisma.user.findMany({
            where: { role: "USER" },
            select: { id: true, name: true, email: true },
        });

        return NextResponse.json({ event, allUsers });
    } catch (error) {
        console.error("Error fetching event details:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        // Handle both simple status update (isClosed) and full edit
        const { isClosed, title, date, location, description } = body;

        const updateData: any = {};
        if (typeof isClosed === 'boolean') updateData.isClosed = isClosed;
        if (title) updateData.title = title;
        if (date) updateData.date = new Date(date);
        if (location) updateData.location = location;
        if (description !== undefined) updateData.description = description;

        const event = await prisma.event.update({
            where: { id },
            data: updateData,
        });

        // Send email if closing the event
        if (isClosed === true) {
            // Fetch users who haven't responded or all users? 
            // Let's send to ALL users to inform them it's closed.
            const users = await prisma.user.findMany({
                select: { email: true },
            });
            const emails = users.map(u => u.email);

            if (emails.length > 0) {
                const { sendEmail } = await import("@/lib/email");
                await sendEmail({
                    to: emails,
                    subject: `Clôture des inscriptions : ${event.title}`,
                    html: `
                        <h1>Inscriptions Clôturées</h1>
                        <p>Les inscriptions pour l'événement <strong>${event.title}</strong> sont désormais closes.</p>
                        <p><strong>Date :</strong> ${new Date(event.date).toLocaleDateString("fr-FR")}</p>
                        <p>Si vous n'avez pas indiqué votre présence, vous êtes considéré comme absent.</p>
                        <a href="${process.env.NEXTAUTH_URL}">Voir le planning</a>
                    `,
                });
            }
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Failed to update event", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        await prisma.event.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete event", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
