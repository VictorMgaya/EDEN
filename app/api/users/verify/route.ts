/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        console.log("Attempting to verify user:", email);

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if this is a Google account
        if (user.provider === 'google') {
            return NextResponse.json(
                { error: "This account uses Google Sign-In. Please sign in with Google." },
                { status: 401 }
            );
        }

        // Verify password for credentials account
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Convert to plain object and remove password
        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json(userResponse);
    } catch (err: any) {
        console.error("Error in verify route:", err);
        return NextResponse.json(
            { error: "Authentication failed", details: err.message },
            { status: 500 }
        );
    }
}
