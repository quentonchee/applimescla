import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const clothingItem = await prisma.clothingItem.findUnique({
            where: { id },
        });

        if (!clothingItem) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (clothingItem.userId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.clothingItem.delete({
            where: { id },
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Failed to delete clothing item", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
