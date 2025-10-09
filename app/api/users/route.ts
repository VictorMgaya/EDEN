/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function PATCH(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession();
        
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { error: "Unauthorized. Please login to continue." },
                { status: 401 }
            );
        }

        const { email, bio } = await request.json();

        // Verify the email matches the session email (prevent users from updating other users)
        if (email !== session.user.email) {
            return NextResponse.json(
                { error: "Forbidden. You can only update your own profile." },
                { status: 403 }
            );
        }

        // Validate bio
        if (!bio || typeof bio !== 'string') {
            return NextResponse.json(
                { error: "Bio is required" },
                { status: 400 }
            );
        }

        const sanitizedBio = bio.trim();
        const wordCount = sanitizedBio.split(/\s+/).filter((word: string) => word.length > 0).length;

        if (wordCount < 50) {
            return NextResponse.json(
                { error: `Bio must be at least 50 words. Current word count: ${wordCount}` },
                { status: 400 }
            );
        }

        if (sanitizedBio.length > 500) {
            return NextResponse.json(
                { error: "Bio cannot exceed 500 characters" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Update user bio
        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { bio: sanitizedBio },
            { new: true, runValidators: true }
        );

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json(
            { message: "Bio updated successfully", user: userResponse },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("Error in PATCH /api/users/update-bio:", err.message);
        return NextResponse.json(
            { error: "An error occurred while updating bio" },
            { status: 500 }
        );
    }
}