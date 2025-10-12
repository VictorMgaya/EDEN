/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { name, email, password, image, provider, bio } = await request.json();

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            // If user exists and is trying to register with credentials but already has a Google account
            if (provider === 'credentials' && user.provider === 'google') {
                return NextResponse.json(
                    { error: "An account with this email already exists via Google. Please sign in with Google." },
                    { status: 409 }
                );
            }
            // If user exists and is trying to register with Google but already has a credentials account
            if (provider === 'google' && user.provider === 'credentials') {
                // Update existing user with Google info if they previously registered with credentials
                user.name = name;
                user.image = image;
                user.provider = provider;
                await user.save();
                const userResponse = user.toObject();
                delete userResponse.password;
                return NextResponse.json(userResponse, { status: 200 });
            }
            // If user exists and is signing in with Google again, just return the user
            if (provider === 'google' && user.provider === 'google') {
                const userResponse = user.toObject();
                delete userResponse.password;
                return NextResponse.json(userResponse, { status: 200 });
            }
            // For credentials provider, if user exists, it means they are trying to register again
            if (provider === 'credentials') {
                return NextResponse.json(
                    { error: "User with this email already exists." },
                    { status: 409 }
                );
            }
        }

        // Hash password if provided (for credentials provider)
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Create new user
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            image: image || 'https://www.gravatar.com/avatar/?d=mp', // Default image
            provider,
            bio: bio || '', // Default empty bio
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json(userResponse, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/users:", error.message);
        return NextResponse.json(
            { error: "An error occurred during user creation." },
            { status: 500 }
        );
    }
}

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

        const { name, email, image, bio } = await request.json();

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

        // Update user profile
        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                image: image?.trim() || 'https://www.gravatar.com/avatar/?d=mp',
                bio: sanitizedBio
            },
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
            { message: "Profile updated successfully", user: userResponse },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("Error in PATCH /api/users:", err.message);
        return NextResponse.json(
            { error: "An error occurred while updating profile" },
            { status: 500 }
        );
    }
}
