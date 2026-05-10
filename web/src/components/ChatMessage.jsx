import React from 'react';
import { marked } from 'marked';
import { Bot, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ChatMessage = ({ role, content }) => {
  const isUser = role === 'user';
  
  return (
    <div className={cn("flex gap-6 max-w-5xl animate-in fade-in slide-in-from-bottom-2", isUser && "ml-auto flex-row-reverse")}>
      <div className={cn(
        "w-10 h-10 rounded shadow-sm flex items-center justify-center flex-shrink-0",
        isUser ? "bg-abb-dark" : "bg-abb-red"
      )}>
        {isUser ? <User className="text-white w-5 h-5" /> : <Bot className="text-white w-5 h-5" />}
      </div>
      <div className={cn(
        "flex-1 p-6 rounded-lg shadow-sm border",
        isUser ? "bg-white border-gray-200 text-gray-800" : "bg-white border-red-50 text-gray-700"
      )}>
        <div 
          className="markdown-body text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
        />
      </div>
    </div>
  );
};

export default ChatMessage;
