/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    sub: string; // Unique identifier for the user
    locale: string; // Preferred language setting
    hd?: string; // Hosted domain for G Suite accounts
}

const userSchema: Schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        given_name: {
            type: String,
            required: true
        },
        family_name: {
            type: String,
            required: true
        },
        picture: {
            type: String,
            required: true
        },
        sub: {
            type: String,
            required: true,
            unique: true
        },
        locale: {
            type: String,
            required: true
        },
        hd: {
            type: String,
            required: false
        }
    });

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
