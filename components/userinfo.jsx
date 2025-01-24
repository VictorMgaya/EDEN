"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "react-feather";
import currentTheme from "@/components/Header";

export default function UserInfo() {
    const { status, data: session } = useSession();

    return (
        <div className={`flex flex-col items-center justify-center  ${currentTheme === " light"
            ? "text-black bg-gradient-to-r from-blue-500/90 to-green-500/90 sm:h-16 md:h-20 lg:h-24 xl:h-28"
            : "text-white bg-gradient-to-r from-gray-900/95 to-green-950/95 sm:h-16 md:h-20 lg:h-24 xl:h-28"
            } rounded-2xl p-8 place-self-center`}>
            <div className="mb-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={session?.user.image || 'eden.svg'} />
                    <AvatarFallback>{session?.user.name}</AvatarFallback>
                </Avatar>
            </div>
            <div className="text-center">
                <h1 className="text-bold text-xl">{session?.user.name || 'My Account'}</h1>
                <h2>Email : <span className="text-bold">{session?.user.email}</span></h2>
                <div className="mt-10 items-center">
                    <Button onClick={() => window.location.href = '/'} className="mr-10">
                        <Home />  HOME
                    </Button>
                    <Button onClick={() => signOut()} className="ml-10">
                        Logout <LogOut />
                    </Button>
                </div>
            </div>

        </div>

    );
}
