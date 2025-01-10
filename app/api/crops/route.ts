import dbConnect from "@/app/lib/dbConnect";
import Crop from "@/app/model/crops";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    try {

        const crops = name
            ? await Crop.find({ name: { $regex: `^${name}`, $options: 'i' } })
            : await Crop.find({});

        return NextResponse.json(crops);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}