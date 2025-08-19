import React from 'react';

export default function MessageList({ messages, bottomRef, formatMessageText }) {
  return (
    <div className="overflow-auto p-3 messages flex-grow-1 pt-5 mt-5">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
        >
          <div className={`p-3 rounded message ${msg.sender === 'user' ? 'userMsg' : 'botMsg'}`}>
            {msg.isHtml && msg.htmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: msg.htmlContent.replace(/\n/g, '<br />') }} />
            ) : (
              msg.custom ? msg.custom : formatMessageText(msg.text)
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
