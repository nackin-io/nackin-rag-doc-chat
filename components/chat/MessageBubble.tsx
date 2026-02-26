"use client";

import { SourceCitations } from "./SourceCitations";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`${isUser ? "You" : "AI"}: ${message.content.slice(0, 50)}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser ? "order-1" : "order-1"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} />
        )}

        <p
          className={`mt-1 text-[10px] text-muted-foreground ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
