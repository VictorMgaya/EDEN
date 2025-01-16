/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema } from "mongoose";


export interface IUser extends Document {
    name: string;
    email: string;
    image: string;
}

const userSchema: Schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        image: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true
    }

);

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
