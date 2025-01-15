/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export default async function handler(req: { method: string; body: { name: any; given_name: any; family_name: any; picture: any; email: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): any; new(): any; }; end: { (arg0: string): void; new(): any; }; }; setHeader: (arg0: string, arg1: string[]) => void; }) {
    if (req.method === 'POST') {
        await dbConnect();
        const { name, given_name, family_name, picture, email } = req.body;

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            const user = await User.create({
                name,
                given_name,
                family_name,
                picture,
                email,
            });

            return res.status(201).json(user);
        } catch (error) {
            console.error("Error creating user:", error);
            return res.status(500).json({ message: "Error creating user" });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

console.log("Incoming registration data:", req?.body);