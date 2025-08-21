import React from 'react';

export default function ClearChatButton({ onClick }) {
  return (
    <div>
      <button className="btn-clear-chat" onClick={onClick}>
        🧹 Clear Chat
      </button>
    </div>
  );
}
