import React from 'react';
import { Icon } from '@iconify/react';

export default function BookTypeSelector({ bookType, handleTypeSelect, inputRef, input, handleInputChange, isMultiline, sendMessage }) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center text-center flex-grow-1">
      <h2 className="mb-4 chatTitle"> What kind of book do you want to write?</h2>
      <ul className="list-unstyled d-flex flex-wrap gap-2 typeList">
        <li>
          <button className={`selection text-start ${bookType === 'Ebook' ? 'selected' : ''}`} onClick={() => handleTypeSelect('Ebook')}>
            <strong>Ebook</strong>
            (40–80 pages)<br />
            <small>• Up to 6 Chapters per Book <br />• Up to 2,000 Words per Chapter</small>
          </button>
        </li>
        <li>
          <button className={`selection text-start ${bookType === 'Short Book' ? 'selected' : ''}`} onClick={() => handleTypeSelect('Short Book')}>
            <strong>Short Book</strong> (80–125 pages)<br />
            <small>• Up to 10 Chapters per Book<br />• Up to 3,000 Words per Chapter</small>
          </button>
        </li>
        <li>
          <button className={`selection text-start ${bookType === 'Full Length Book' ? 'selected' : ''}`} onClick={() => handleTypeSelect('Full Length Book')}>
            <strong>Full Length Book</strong> (125–200 pages)<br />
            <small>• Up to 12 Chapters per Book<br />• Up to 4,000 Words per Chapter</small>
          </button>
        </li>
      </ul>
      <div className={`chatInputBg${isMultiline ? " multiline" : ""}`}>
        <textarea
          ref={inputRef}
          className="chatInput"
          placeholder="Is it Ebook, Short Length Book or Full Length Book..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          rows={1}
        />
  <button className="btn-chat" onClick={() => sendMessage(input)}>
          <Icon icon="fa:send-o" />
        </button>
      </div>
    </div>
  );
}
