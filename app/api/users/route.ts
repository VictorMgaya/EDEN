/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export async function POST(request: Request) {
    try {
        const { name, email, password, image, provider } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // If it's a Google sign-in and user exists, just return success
            if (provider === 'google') {
                return NextResponse.json(
                    { message: "User already exists", user: existingUser },
                    { status: 200 }
                );
            }

            // If it's a credentials sign-up but user exists
            if (existingUser.provider === 'google') {
                return NextResponse.json(
                    { error: "This email is already registered with Google. Please sign in with Google." },
                    { status: 400 }
                );
            } else {
                return NextResponse.json(
                    { error: "Email already registered" },
                    { status: 400 }
                );
            }
        }

        // Create new user
        const userData = {
            name,
            email,
            password,
            image: image || 'https://www.gravatar.com/avatar/?d=mp',
            provider
        };

        // Hash password for credentials provider
        if (provider === 'credentials') {
            if (!password) {
                return NextResponse.json(
                    { error: "Password is required for email registration" },
                    { status: 400 }
                );
            }
            userData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.create(userData);
        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json(
            { message: "User created successfully", user: userResponse },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("Error in POST /api/users:", err.message);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}