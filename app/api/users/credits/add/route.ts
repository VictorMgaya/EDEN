import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized. Please login to continue." },
                { status: 401 }
            );
        }

        const { credits, description, adminEmail } = await request.json();

        // Validate input
        if (!credits || credits <= 0) {
            return NextResponse.json(
                { error: "Credits amount must be greater than 0" },
                { status: 400 }
            );
        }

        // Optional: Check if requester is admin (you can implement admin check here)
        if (adminEmail && adminEmail !== session.user.email) {
            // You can add admin verification logic here
            console.log(`Credit addition requested by ${session.user.email} for ${adminEmail}`);
        }

        await dbConnect();
        const user = await User.findOne({ email: adminEmail || session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Add credits to user account
        const previousCredits = user.credits || 0;
        user.credits = previousCredits + credits;

        // Log the credit addition
        const usageRecord = {
            action: 'credit',
            amount: credits,
            description: description || `Manual credit addition - ${credits} credits`,
            metadata: {
                type: 'manual_addition',
                addedBy: session.user.email,
                previousCredits: previousCredits,
                newCredits: user.credits
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

        return NextResponse.json({
            success: true,
            credits: user.credits,
            added: credits,
            previousCredits: previousCredits,
            description: description || 'Credits added successfully'
        });
    } catch (error: unknown) {
        console.error("Error in POST /api/users/credits/add:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "An error occurred while adding credits" },
            { status: 500 }
        );
    }
}
