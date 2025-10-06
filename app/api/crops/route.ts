/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from "@/app/lib/dbConnect";
import Crop from "@/app/model/Experts";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    try {
        const Experts = id
            ? await Crop.findById(id)
            : name
                ? await Crop.find({ name: { $regex: `^${name}`, $options: 'i' } })
                : await Crop.find({});

        if (!Experts || (Array.isArray(Experts) && !Experts.length)) {
            return NextResponse.json({ message: 'No Experts found' }, { status: 404 });
        }

        return NextResponse.json(Experts);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
