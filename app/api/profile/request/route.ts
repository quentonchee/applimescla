import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// POST: Create a new change request
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { newName, newEmail, newInstrument, newImage } = await req.json();

        // Check if there is already a pending request
        const existingRequest = await prisma.profileChangeRequest.findFirst({
            where: {
                userId: session.user.id,
                status: "PENDING",
            },
        });

        if (existingRequest) {
            return new NextResponse("Une demande est déjà en cours", { status: 400 });
        }

        const request = await prisma.profileChangeRequest.create({
            data: {
                userId: session.user.id,
                newName,
                newEmail,
                newInstrument,
                newImage,
            },
        });

        return NextResponse.json(request);
    } catch (error) {
        console.error("Failed to create profile request", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET: List all pending requests (ADMIN ONLY)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const requests = await prisma.profileChangeRequest.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        instrument: true,
                        membershipNumber: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Failed to fetch profile requests", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH: Approve or Reject a request (ADMIN ONLY)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { requestId, action } = await req.json(); // action: "APPROVE" or "REJECT"

        const request = await prisma.profileChangeRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) return new NextResponse("Request not found", { status: 404 });

        if (action === "REJECT") {
            await prisma.profileChangeRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" },
            });
            return NextResponse.json({ message: "Request rejected" });
        }

        if (action === "APPROVE") {
            // Update the user profile
            const updateData: any = {};
            if (request.newName) updateData.name = request.newName;
            if (request.newEmail) updateData.email = request.newEmail;
            if (request.newInstrument) updateData.instrument = request.newInstrument;
            if (request.newImage) updateData.image = request.newImage;

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: request.userId },
                    data: updateData,
                }),
                prisma.profileChangeRequest.update({
                    where: { id: requestId },
                    data: { status: "APPROVED" },
                }),
            ]);

            return NextResponse.json({ message: "Request approved and profile updated" });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error("Failed to process request", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
