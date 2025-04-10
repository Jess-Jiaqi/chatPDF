import FileUpload from "@/components/FileUpload";
import SubscriptionButton from "@/components/SubscriptionButton";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { checkSubscription } from "@/lib/subscription";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  const isPro = await checkSubscription();
  let firstChat = undefined;
  if (userId) {
    const userChats = await db.select().from(chats).where(eq(chats.userId, userId));
    if (userChats && userChats.length > 0) {
      firstChat = userChats[0];
    }
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-indigo-200 via-red-200 to-yellow-100">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold text-gray-800">
              Chat with any PDF
            </h1>
            <ClerkProvider afterSignOutUrl="/">
              <UserButton />
            </ClerkProvider>
          </div>

          <div className="flex mt-2">
            {isAuth && firstChat && 
              <Link href={`/chat/${firstChat.id}`}>
                <Button>Go to Chats <ArrowRight className="ml-1" /></Button>
              </Link>
            }
            <div className="ml-3">
              <SubscriptionButton isPro={isPro} />
            </div>
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-700">
            Transform your PDFs into intelligent conversations — upload, ask,
            and edit with AI-powered precision.
          </p>

          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload />
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to get started!
                  <LogIn className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
