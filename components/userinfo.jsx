"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Route } from "lucide-react";

export default function UserInfo() {
    const { status, data: session } = useSession();

    return (
        <div className="flex flex-col items-center justify-center bg-green-600/50 rounded-2xl p-8 place-self-center">
            <div className="mb-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={session?.user.image} />
                    <AvatarFallback>{session?.user.name}</AvatarFallback>
                </Avatar>
            </div>
            <div className="text-center">
                <h1 className="text-bold text-xl">{session?.user.name}</h1>
                <h2>Email : <span className="text-bold">{session?.user.email}</span></h2>
                <div className="justify-between items-end">
                    <Button onClick={() => window.location.href = '/'} className="mt-2">
                        HOME
                    </Button>
                    <Button onClick={() => signOut()} className="mt-2">
                        Sign Out
                    </Button>
                </div>
            </div>

        </div>

    );
}
