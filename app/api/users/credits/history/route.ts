import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function GET(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { error: "Unauthorized. Please login to continue." },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Return usage history with pagination
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const history = user.usageHistory || [];
        const total = history.length;
        const paginatedHistory = history.slice(skip, skip + limit);

        return NextResponse.json({
            history: paginatedHistory,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Error fetching usage history:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "An error occurred while fetching usage history." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { error: "Unauthorized. Please login to continue." },
                { status: 401 }
            );
        }

        const { action, amount, description, metadata } = await request.json();

        if (!action || !amount) {
            return NextResponse.json(
                { error: "Action and amount are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Create usage record
        const usageRecord = {
            action,
            amount,
            description: description || `${action} of ${amount} credits`,
            timestamp: new Date(),
            metadata: metadata || {}
        };

        // Add to usage history
        if (!user.usageHistory) {
            user.usageHistory = [];
        }

        user.usageHistory.unshift(usageRecord); // Add to beginning for chronological order

        // Keep only last 1000 records to prevent database bloat
        if (user.usageHistory.length > 1000) {
            user.usageHistory = user.usageHistory.slice(0, 1000);
        }

        await user.save();

        return NextResponse.json({
            success: true,
            record: usageRecord
        }, { status: 201 });

    } catch (error: unknown) {
        console.error("Error logging usage:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "An error occurred while logging usage." },
            { status: 500 }
        );
    }
}
