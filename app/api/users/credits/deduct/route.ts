/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Freemium users: deduct 10 credits
    if (user.credits < 10) {
        return NextResponse.json({
            error: "Insufficient credits. You need 10 credits to send messages.",
            credits: user.credits,
            needed: 10
        }, { status: 402 });
    }

    user.credits -= 10;
    await user.save();

    return NextResponse.json({
        credits: user.credits,
        subscription: subscriptionType
    });
    } catch (error: any) {
        console.error("Error in POST /api/users/credits/deduct:", error.message);
        return NextResponse.json(
            { error: "An error occurred while deducting credits" },
            { status: 500 }
        );
    }
}
