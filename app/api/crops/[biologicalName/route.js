import dbConnect from "@/app/lib/dbConnect";

import Crop from "@/app/model/crops";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    await dbConnect();

    const { _id } = params;

    try {
        // Find a crop by biologicalName (case-sensitive, but you can adjust)
        const crop = await Crop.findOne({ _id });

        if (!crop) {
            return NextResponse.json(
                { error: `Crop with ID "${_id}" not found.` },
                { status: 404 }
            );
        }

        return NextResponse.json(crop);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
