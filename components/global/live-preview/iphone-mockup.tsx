import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaneBlue, SmartAi } from "@/icons";

type Props = {
  message: string;
  isAi?: boolean;
};

function IphoneMockup({ message, isAi = false }: Props) {
  const displayMessage = message.trim() || "Type a message to preview...";

  return (
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[500px] w-[280px] shadow-xl overflow-hidden animate-fade-in-up">
      {/* Notch */}
      <div className="w-[100px] h-[18px] bg-gray-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[1rem] z-20"></div>

      {/* Screen Content */}
      <div className="bg-[var(--card-bg)] w-full h-full relative flex flex-col pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-3 pt-4 border-b border-[var(--border-color)] bg-[var(--page-bg)] z-10">
          <Avatar className="w-8 h-8 ring-2 ring-[var(--accent-magenta)]/20">
            <AvatarImage src="/janus-logo.png" />
            <AvatarFallback className="bg-gradient-to-br from-[#3352CC] to-[#1C2D70] text-white text-[10px] font-bold">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {isAi ? "Smart AI Agent" : "Your Account"}
            </span>
            <span className="text-[9px] text-[var(--text-tertiary)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Now
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-[var(--page-bg)]">
          {/* Incoming Message Mock */}
          <div className="flex gap-2 items-end max-w-[85%] self-start">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-whisper)] border border-[var(--accent-veil)] shrink-0 flex items-center justify-center text-[10px]">
              👤
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-2xl rounded-bl-sm text-xs shadow-sm">
              Hey! I matched your keyword. What&apos;s next?
            </div>
          </div>

          {/* Outgoing Message (Live Preview) */}
          <div className="flex gap-2 items-end max-w-[85%] self-end flex-row-reverse mt-2">
            <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-[#3352CC] to-[#1C2D70] shadow-sm">
              {isAi ? <SmartAi /> : <PlaneBlue />}
            </div>
            <div
              className={`px-3 py-2 rounded-2xl rounded-br-sm text-xs shadow-sm whitespace-pre-wrap break-words ${
                isAi
                  ? "bg-[var(--card-bg)] border-2 border-[#3352CC]/40 text-[var(--text-primary)]"
                  : "bg-gradient-to-br from-[#3352CC] to-[#1C2D70] text-white"
              }`}
            >
              {displayMessage}
            </div>
          </div>
        </div>

        {/* Input Bar Mock */}
        <div className="h-14 border-t border-[var(--border-color)] bg-[var(--card-bg)] flex items-center px-4 gap-3">
          <div className="w-full h-8 rounded-full border border-[var(--border-color)] bg-[var(--page-bg)] flex items-center px-3">
            <span className="text-[10px] text-[var(--text-tertiary)]">Message...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IphoneMockup;
