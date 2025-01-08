import dbConnect from "@/app/lib/dbConnect";
import Crop from "@/app/model/crops";
import { NextResponse } from "next/server";

export async function GET() {
    await dbConnect();

    try {
        const crops = await Crop.find({});

        return NextResponse.json(crops);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
       return NextResponse.json({ error: err.message });
    }
}