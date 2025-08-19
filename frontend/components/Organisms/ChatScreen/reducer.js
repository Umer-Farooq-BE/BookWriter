import { generateId } from "./chatUtils";

export const initialState = {
  // UI
  input: "",
  isGenerating: false,
  isLoadingChat: false,
  isMultiline: false,
  isEditing: false, // New state to track if user is editing a message
  editingMessageId: null, // ID of the message being edited
  // flow
  messages: [
    {
      id: generateId(),
      sender: "bot",
      text: "Hi 👋! What kind of book do you want to write?",
    },
  ],
  step: "bookType", // 'bookType' | 'summary' | 'title' | 'chapters' | 'outline' | 'customOutline' | 'chapterTitle' | 'keypoints' | 'content'
  keyPoints: ["", "", ""],
  bookType: "",
  selectedTitle: "",
  selectedChapter: "",
  selectedBookType: "",
  chapterCount: null,
  bookId: null,
  titleOptions: [],
  refinedSummary: "",
  summary: "",
  currentChapter: 1,
  hasKeyPoints: false,
  outline: [],
  useSimpleInput: false,
  useCustomOutline: false,
  customOutline: [],
};

export function reducer(state, action) {
  switch (action.type) {
    case "INIT_FROM_STORAGE":
      return { ...state, ...action.payload };
    case "SET_FIELD":
      return { ...state, [action.key]: action.value };
    case "START_EDITING":
      return { 
        ...state, 
        isEditing: true, 
        editingMessageId: action.messageId,
        input: action.messageText 
      };
    case "END_EDITING":
      return { 
        ...state, 
        isEditing: false, 
        editingMessageId: null 
      };
    case "APPEND_MESSAGE":
      // Prevent adding new messages while editing
      if (state.isEditing) return state;
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "REPLACE_MESSAGE": {
      // Prevent replacing messages while editing (unless it's the message being edited)
      if (state.isEditing && action.id !== state.editingMessageId) return state;
      const next = state.messages.map((m) =>
        m.id === action.id ? action.message : m
      );
      return { ...state, messages: next };
    }
    case "PATCH_MESSAGE_TEXT": {
      const next = state.messages.map((m) =>
        m.id === action.id ? { ...m, text: action.text } : m
      );
      return { ...state, messages: next };
    }
    default:
      return state;
  }
}
