/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from "@/app/lib/dbConnect";
import Crop from "@/app/model/crops";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    try {
        const crops = id
            ? await Crop.findById(id)
            : name
                ? await Crop.find({ name: { $regex: `^${name}`, $options: 'i' } })
                : await Crop.find({});

        if (!crops || (Array.isArray(crops) && !crops.length)) {
            return NextResponse.json({ message: 'No crops found' }, { status: 404 });
        }

        return NextResponse.json(crops);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
