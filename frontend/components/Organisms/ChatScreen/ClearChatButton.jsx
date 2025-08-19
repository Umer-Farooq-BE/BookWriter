import React from 'react';

export default function ClearChatButton({ handleClearChat }) {
  return (
    <div>
      <button className="btn-clear-chat" onClick={handleClearChat}>
        🧹 Clear Chat
      </button>
    </div>
  );
}
