/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";
import { NextResponse } from "next/server";



export async function POST(request: Request) {
    try {
        const { name, email, image } = await request.json();

        if (!name || !email || !image) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await dbConnect();
        const user = await User.create({ name, email, image });

        return NextResponse.json({ message: "User Registered", user }, { status: 201 });
    } catch (err: any) {
        console.error("Error in POST /api/users:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}




export async function GET(request: Request) {
    await dbConnect();

    try {
        const users = await User.find({});
        return NextResponse.json(users);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}