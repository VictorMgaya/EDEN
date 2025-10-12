/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function GET(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { error: "Unauthorized. Please login to continue." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        // Verify the email matches the session email (prevent users from accessing other users' profiles)
        if (!email || email !== session.user.email) {
            return NextResponse.json(
                { error: "Forbidden. You can only access your own profile." },
                { status: 403 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email }).select('-password');

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user, { status: 200 });
    } catch (err: any) {
        console.error("Error in GET /api/users/profile:", err.message);
        return NextResponse.json(
            { error: "An error occurred while fetching profile" },
            { status: 500 }
        );
    }
}
