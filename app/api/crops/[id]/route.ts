/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from "@/app/lib/dbConnect";
import Crop from "@/app/model/crops";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// Define the type for params
type tParams = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: tParams }) {
    const { id } = await params;

    try {
        // Connect to the database
        await dbConnect();

        // Validate if the `id` is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
        }

        // Fetch the crop by ID
        const crop = await Crop.findById(id);

        if (!crop) {
            return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
        }

        // Convert _id to a string and return crop data
        const cropData = { ...crop.toObject(), _id: crop._id.toString() };

        return NextResponse.json(cropData, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            {
                message: 'Error fetching crop',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
