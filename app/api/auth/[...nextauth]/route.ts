import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const { name, email, image } = user;

                // Debugging environment variables
                console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
                console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
                console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

                try {
                    const res = await fetch(`https://www.edenapp.site/api/users`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name,
                            email,
                            image,
                        }),
                    });

                    if (res.ok) {
                        console.log("User registration successful.");
                        return true;
                    } else {
                        console.error("User registration failed:", res.statusText);
                        return false;
                    }
                } catch (error) {
                    console.error("Error during user registration:", error);
                    return false;
                }
            }
            return true;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
