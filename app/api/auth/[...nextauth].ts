import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/model/user";

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, }) {
            try {
                await dbConnect();
                const { email, name, image } = user;
                const sub = account?.providerAccountId;

                // Check if user exists
                const existingUser = await User.findOne({ email });
                if (!existingUser) {
                    // Create new user
                    await User.create({
                        name,
                        email,
                        image,
                        sub,
                    });
                }

                return true; // Sign-in allowed
            } catch (error) {
                console.error("Error in signIn callback:", error);
                return false; // Sign-in denied
            }
        },
    }, secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin", // Custom sign-in page
        error: "/auth/error",    // Custom error page
    },
});