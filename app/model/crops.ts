import mongoose, { Document, Schema } from "mongoose";

export interface ICrops extends Document {
    id: string;
    name: string;
    biologicalName: string;
    soilClass: string;
    avgGrowthTime: string;
    description: string;
    Kc: Float32Array;
    infosources: string;
    imageUrl: string;
}

const cropSchema: Schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        biologicalName: {
            type: String,
            required: true
        },
        soilClass: {
            type: String,
            required: true
        },
        avgGrowthTime: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        Kc: {
            type: Number,
            required: true
        },
        infosources: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        },

    });

const Crop = mongoose.models.Crop || mongoose.model<ICrops>("Crop", cropSchema);


export default Crop;