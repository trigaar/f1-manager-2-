import React from 'react';

interface CommentaryBoxProps {
  message: string | null;
}

const CommentaryBox: React.FC<CommentaryBoxProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div 
      key={message} // Using key to re-mount and re-trigger animation on new message
      className="bg-gray-800 border-l-4 border-red-500 rounded-lg shadow-lg p-3 animate-fade-in"
    >
      <div className="flex items-center mb-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="ml-2 text-xs font-bold text-red-400 uppercase tracking-wider">Race Highlight</span>
      </div>
      <p className="text-sm text-white font-semibold">{message}</p>
    </div>
  );
};

export default CommentaryBox;
