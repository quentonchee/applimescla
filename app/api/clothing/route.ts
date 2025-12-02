import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const clothingItems = await prisma.clothingItem.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(clothingItems);
    } catch (error) {
        console.error("Failed to fetch clothing items", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { name, image } = await req.json();

        if (!name || !image) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const clothingItem = await prisma.clothingItem.create({
            data: {
                name,
                image,
                userId: session.user.id,
            },
        });

        return NextResponse.json(clothingItem);
    } catch (error) {
        console.error("Failed to create clothing item", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
