import React, { useEffect } from "react";
import { Message } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Props = {
  messages: Message[];
  isLoading: boolean;
};

const MessageList = ({ messages, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }
  
  useEffect(() => {
    console.log("current message list:", messages);
  }, [messages]);

  
  if (messages === undefined) return <></>;

  return (
    <div className="flex flex-col gap-2 px-4">
      {messages.map((message) => {
        
        const content = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
          
        return (
          <div
            key={message.id}
            className={cn("flex", {
              "justify-end pl-10": message.role === "user",
              "justify-start pr-10": message.role === "assistant",
            })}
          >
            <div
              className={cn(
                "rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10",
                {
                  "bg-blue-600 text-white": message.role === "user",
                  "bg-gray-100": message.role === "assistant",
                }
              )}
            >
              <p>{content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
