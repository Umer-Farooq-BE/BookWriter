import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { formatISO } from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code, cause);
  }
  return response.json();
};

export async function fetchWithErrorHandlers(input, init) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code, cause);
    }

    return response;
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


export function getMostRecentUserMessage(messages) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(documents, index) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();
  return documents[index].createdAt;
}

export function getTrailingMessageId({ messages }) {
  const trailingMessage = messages.at(-1);
  if (!trailingMessage) return null;
  return trailingMessage.id;
}

export function sanitizeText(text) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages) {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts,
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}