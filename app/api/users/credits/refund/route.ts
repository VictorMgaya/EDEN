import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { error: "Unauthorized. Please login to continue." },
                { status: 401 }
            );
        }

        const { amount, description, metadata } = await request.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Valid refund amount is required" },
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

        // Add credits back to user
        user.credits += amount;
        await user.save();

        // Log refund in usage history
        try {
            const usageRecord = {
                action: 'credit',
                amount: amount,
                description: description || `Refund of ${amount} credits`,
                metadata: {
                    type: 'refund',
                    reason: metadata?.reason || 'api_error',
                    ...metadata
                }
            };

            if (!user.usageHistory) {
                user.usageHistory = [];
            }

            user.usageHistory.unshift(usageRecord);

            // Keep only last 1000 records
            if (user.usageHistory.length > 1000) {
                user.usageHistory = user.usageHistory.slice(0, 1000);
            }

            await user.save();
        } catch (historyError) {
            console.error("Failed to log refund history:", historyError);
            // Don't fail the request if history logging fails
        }

        return NextResponse.json({
            success: true,
            credits: user.credits,
            refunded: amount
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Error in POST /api/users/credits/refund:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "An error occurred while processing refund." },
            { status: 500 }
        );
    }
}
