import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function POST() {
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

    // Pro and Enterprise users have unlimited credits
    if (subscriptionType === 'pro' || subscriptionType === 'enterprise') {
        return NextResponse.json({
            credits: user.credits,
            subscription: subscriptionType,
            unlimited: true
        });
    }

    // Determine credits needed based on whether this is the first analyzed data call
    const isFirstCall = user.firstAnalyzedDataCall;
    const creditsNeeded = isFirstCall ? 12 : 10;

    // Check if user has enough credits
    if (user.credits < creditsNeeded) {
        return NextResponse.json({
            error: `Insufficient credits. You need ${creditsNeeded} credits for ${isFirstCall ? 'analyzed data' : 'messages'}.`,
            credits: user.credits,
            needed: creditsNeeded,
            isFirstCall: isFirstCall
        }, { status: 402 });
    }

    // Deduct credits and update first call status
    user.credits -= creditsNeeded;
    if (isFirstCall) {
        user.firstAnalyzedDataCall = false;
    }
    await user.save();

    // Log usage history
    try {
        const usageRecord = {
            action: 'debit',
            amount: creditsNeeded,
            description: `AI Expert ${isFirstCall ? 'initial analysis' : 'follow-up message'}`,
            metadata: {
                type: isFirstCall ? 'initial_analysis' : 'follow_up_message',
                subscription: subscriptionType
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
        console.error("Failed to log usage history:", historyError);
        // Don't fail the request if history logging fails
    }

    return NextResponse.json({
        credits: user.credits,
        subscription: subscriptionType,
        charged: creditsNeeded,
        isFirstCall: isFirstCall
    });
    } catch (error: unknown) {
        console.error("Error in POST /api/users/credits/deduct:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "An error occurred while deducting credits" },
            { status: 500 }
        );
    }
}
