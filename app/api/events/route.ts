import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { title, date, location, description } = await req.json();

        const event = await prisma.event.create({
            data: {
                title,
                date: new Date(date),
                location,
                description,
            },
        });

        // Send email to all users
        const users = await prisma.user.findMany({
            select: { email: true },
        });
        const emails = users.map(u => u.email);

        if (emails.length > 0) {
            const { sendEmail } = await import("@/lib/email");
            await sendEmail({
                to: emails,
                subject: `Nouvel Événement : ${title}`,
                html: `
                    <h1>Nouvel Événement Ajouté !</h1>
                    <p>Un nouvel événement <strong>${title}</strong> a été ajouté au calendrier.</p>
                    <p><strong>Date :</strong> ${new Date(date).toLocaleDateString("fr-FR")}</p>
                    <p><strong>Lieu :</strong> ${location || "Non précisé"}</p>
                    <p>Merci de vous connecter pour indiquer votre présence.</p>
                    <a href="${process.env.NEXTAUTH_URL}">Accéder à l'application</a>
                `,
            });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const events = await prisma.event.findMany({
        orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
}
