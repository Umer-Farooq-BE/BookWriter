import { generateId } from "./chatUtils";

export const initialState = {
  // UI
  input: "",
  isGenerating: false,
  isLoadingChat: false,
  isMultiline: false,
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
    case "APPEND_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "REPLACE_MESSAGE": {
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
