import React from 'react';
import { Icon } from '@iconify/react';

export default function MainChatInput({
  inputRef,
  input,
  isMultiline,
  handleInputChange,
  sendMessage,
  placeholder,
}) {
  return (
    <div className={`chatInputBg${isMultiline ? " multiline" : ""} d-flex align-items-center gap-2`}>
      <textarea
        ref={inputRef}
        className="chatInput"
        placeholder={placeholder}
        value={input}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        rows={1}
      />
      <button className="btn-chat" onClick={() => sendMessage()}>
        <Icon icon="fa:send-o" />
      </button>
    </div>
  );
}
