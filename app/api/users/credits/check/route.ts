/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session || !session.user?.email) {
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

    // Ensure subscription defaults to freemium if not set
    if (!user.subscription || !user.subscription.type) {
        if (!user.subscription) {
            user.subscription = { type: 'freemium' };
        } else if (!user.subscription.type) {
            user.subscription.type = 'freemium';
        }
        await user.save();
    }

    const subscriptionType = user.subscription?.type || 'freemium';

    // Check if credits need to be reset (every 6 hours)
    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);
    const hoursDiff = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    let creditsToAdd = 0;
    if (hoursDiff >= 6) {
        // Reset credits based on subscription type
        if (subscriptionType === 'freemium') {
            creditsToAdd = 50;
            // Cap at 100 for freemium
            user.credits = Math.min(user.credits + creditsToAdd, 100);
        } else {
            // Pro and Enterprise get unlimited credits
            creditsToAdd = 50;
            user.credits = user.credits + creditsToAdd;
        }
        user.lastCreditReset = now;
        await user.save();
    }

        return NextResponse.json({
            credits: user.credits,
            subscription: user.subscription.type,
            lastReset: user.lastCreditReset,
            creditsAdded: creditsToAdd
        });
    } catch (error: any) {
        console.error("Error in GET /api/users/credits/check:", error.message);
        return NextResponse.json(
            { error: "An error occurred while checking credits" },
            { status: 500 }
        );
    }
}
