/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    await dbConnect();

    try {
        const users = await User.find({});
        return NextResponse.json(users);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    const body = await request.json();

    try {
        const newUser = new User(body);
        await newUser.save();
        return NextResponse.json(newUser, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
