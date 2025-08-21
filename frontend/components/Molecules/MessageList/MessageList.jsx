import React from 'react';
import { Icon } from '@iconify/react';

export default function MessageList({ messages, bottomRef, formatMessageText, onEditMessage, isEditing }) {
  // Function to check if a message is a book type selection
  const isBookTypeMessage = (msg) => {
    if (msg.sender !== 'user') return false;
    const text = msg.text?.toLowerCase() || '';
    return text.includes('ebook') || text.includes('short book') || text.includes('full length book');
  };

  return (
    <div className="overflow-auto p-3 messages flex-grow-1 pt-5 mt-5">
      {isEditing && (
        <div className="editing-indicator p-2 mb-3 text-center" style={{
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <Icon icon="ph:pencil" className="me-2" />
          Editing mode: Continue from where you left off
        </div>
      )}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
        >
          <div className={`p-3 rounded message ${msg.sender === 'user' ? 'userMsg' : 'botMsg'} position-relative`}>
            {msg.sender === 'user' && !isBookTypeMessage(msg) && (
              <button
                className="edit-message-btn"
                onClick={() => {
                  // onEditMessage(msg.id, msg.text);
                }}
                title="Edit message"
              >
                <Icon icon="ph:pencil" style={{ fontSize: '12px', color: 'white' }} />
              </button>
            )}
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
