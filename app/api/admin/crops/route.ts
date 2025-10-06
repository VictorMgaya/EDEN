import dbConnect from "@/app/lib/dbConnect";
import Crop from "@/app/model/Experts";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
    await dbConnect();
    const data = await request.json();

    try {
        const updatedCrop = await Crop.findByIdAndUpdate(
            data._id,
            data,
            { new: true, runValidators: true }
        );
        return NextResponse.json(updatedCrop);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    const data = await request.json();

    try {
        const newCrop = await Crop.create(data);
        return NextResponse.json(newCrop);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
