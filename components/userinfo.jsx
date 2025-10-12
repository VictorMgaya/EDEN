"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Mail, User } from "react-feather";
import currentTheme from "@/components/Header";

export default function UserInfo() {
    const { status, data: session } = useSession();

    return (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 min-h-screen p-6 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-blue-200 dark:border-gray-700 max-w-2xl w-full">
                <div className="relative mb-8 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                    <Avatar className="relative h-32 w-32 ring-4 ring-offset-4 ring-green-500/50">
                        <AvatarImage
                            src={session?.user.image || 'eden.svg'}
                            alt="Profile Picture"
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-green-200 to-blue-200 text-green-800 text-2xl font-bold">
                            {session?.user.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="text-center space-y-6 w-full max-w-md">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <User className="w-5 h-5 opacity-75" />
                            <h1 className="text-3xl font-bold tracking-tight">
                                {session?.user.name || 'My Account'}
                            </h1>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-lg">
                            <Mail className="w-4 h-4 opacity-75" />
                            <span className="font-medium">{session?.user.email}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 pt-8">
                        <Button
                            onClick={() => window.location.href = '/auth/edit'}
                            className="group flex items-center gap-3 px-8 py-6 bg-blue-600 hover:bg-blue-700 transition-all duration-300"
                        >
                            <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold">EDIT PROFILE</span>
                        </Button>

                        <div className="flex items-center gap-8">
                            <Button
                                onClick={() => window.location.href = '/'}
                                className="group flex items-center gap-3 px-8 py-6 bg-green-600 hover:bg-green-700 transition-all duration-300"
                            >
                                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold">HOME</span>
                            </Button>

                            <Button
                                onClick={() => signOut()}
                                className="group flex items-center gap-3 px-8 py-6 bg-red-600 hover:bg-red-700 transition-all duration-300"
                            >
                                <span className="font-semibold">LOGOUT</span>
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
