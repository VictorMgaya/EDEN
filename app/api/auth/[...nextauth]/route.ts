/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log("Missing credentials in authorize"); // Debug log
                    throw new Error("Invalid credentials");
                }

                try {
                    console.log("Attempting to verify credentials"); // Debug log
                    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/users/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await response.json();
                    console.log("Verify response:", response.status, data); // Debug log

                    if (!response.ok) {
                        throw new Error(data.error || "Invalid credentials");
                    }

                    return {
                        id: data._id,
                        name: data.name,
                        email: data.email,
                        image: data.image
                    };
                } catch (error: any) {
                    console.error("Auth error in authorize:", error); // Debug log
                    throw new Error(error.message || "Authentication failed");
                }
            }
        })
    ],
    pages: {
        signIn: '/auth',
    },
    session: {
        strategy: "jwt"
    },
    debug: true, // Enable debug mode
    callbacks: {
        async signIn({ user, account }) {
            console.log("SignIn callback:", { user, account }); // Debug log
            if (account?.provider === "google") {
                try {
                    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            provider: 'google'
                        }),
                    });

                    if (!response.ok) {
                        console.error("Error saving Google user:", await response.json()); // Debug log
                        return false;
                    }
                } catch (error) {
                    console.error("Error in Google sign in:", error); // Debug log
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            console.log("JWT callback:", { token, user }); // Debug log
            if (user) {
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session callback:", { session, token }); // Debug log
            session.user = token.user as any;
            return session;
        }
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };