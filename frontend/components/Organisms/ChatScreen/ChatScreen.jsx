"use client";

// Reducer-based refactor in plain JavaScript  with a debounced persistence hook.

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import "../../../stylesheets/style.css";

import {
  askQuestion,
  saveTitle,
  createBook,
  generateChapterStream,
  loadChatState,
  saveChatState,
} from "../../../utils/api";

import MainChatInput from "../../Molecules/MainChatInput";
import KeypointInputForm from "../../Molecules/KeypointInputForm";
import ClearChatButton from "../../Atoms/ClearChatButton";
import MessageList from "../../Molecules/MessageList";
import BookTypeSelector from "../../Molecules/BookTypeSelector";
import CustomOutlineForm from "../../Molecules/CustomOutlineForm";
import {
  formatMessageText,
  getRequiredKeyPoints,
  serializeMessages,
} from "./chatUtils";
import { initialState, reducer } from "./reducer";
import { useDebouncedPersistence } from "./hooks/useDebouncedPersistence";
import {
  createSummaryPromptMessage,
  createTitleSuggestionMessage,
  createOutlineMessage,
} from "./messages";

// ---------------------- Component ----------------------
export default function ChatScreen({ initialBookId = null }) {
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const keyPointRefs = useRef([]);
  const [state, dispatch] = useReducer(reducer, initialState);

  const isFirstPrompt =
    state.messages.length === 1 && state.step ===  "bookType";

  // Scroll to bottom on message change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isGenerating]);

  // Auto-height for textarea when input changes
  useLayoutEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = inputRef.current.scrollHeight + "px";
  }, [state.input]);

  // Load stored chat when an initial book id is provided
  useEffect(() => {
    const load = async () => {
      if (!initialBookId) return;
      dispatch({ type: "SET_FIELD", key: "isLoadingChat", value: true });
      try {
        const stored = await loadChatState(initialBookId);
        if (stored) {
          const restoredMessages = Array.isArray(stored.messages)
            ? stored.messages.map((m) => {
                if (m.customType === "titleSuggestions" && m.data) {
                  return createTitleSuggestionMessage(
                    m.id,
                    m.data.refinedSummary || "",
                    m.data.titles || [],
                    m.data.originalSummary || "",
                    handleTitleSelect,
                    handleSummaryRegeneration
                  );
                }
                if (m.customType === "outline" && m.data) {
                  return createOutlineMessage(
                    m.id,
                    m.data.outline || [],
                    (ol) => handleOutlineDecision(true, ol),
                    () => handleOutlineDecision(false),
                    handleWriteOwnOutline
                  );
                }
                if (m.customType === "summaryPrompt") {
                  return createSummaryPromptMessage(m.id);
                }
                return m;
              })
            : [];

          dispatch({
            type: "INIT_FROM_STORAGE",
            payload: {
              ...stored,
              messages: restoredMessages,
              bookId: initialBookId,
              isLoadingChat: false,
              useSimpleInput: false,
            },
          });
        }
        dispatch({ type: "SET_FIELD", key: "bookId", value: initialBookId });
      } catch (e) {
        console.error("Failed to load stored chat", e);
      } finally {
        dispatch({ type: "SET_FIELD", key: "isLoadingChat", value: false });
        dispatch({ type: "SET_FIELD", key: "useSimpleInput", value: false });
      }
    };
    load();
  }, [initialBookId]);

  // Debounced persistence (only minimal, serializable slice)
  const serializableMessages = useMemo(
    () => serializeMessages(state.messages),
    [state.messages]
  );

  const payload = useMemo(
    () => ({
      messages: serializableMessages,
      step: state.step,
      bookType: state.bookType,
      selectedBookType: state.selectedBookType,
      selectedTitle: state.selectedTitle,
      selectedChapter: state.selectedChapter,
      chapterCount: state.chapterCount,
      summary: state.summary,
      refinedSummary: state.refinedSummary,
      titleOptions: state.titleOptions,
      currentChapter: state.currentChapter,
      keyPoints: state.keyPoints,
      hasKeyPoints: state.hasKeyPoints,
      outline: state.outline,
      useCustomOutline: state.useCustomOutline,
      customOutline: state.customOutline,
    }),
    [
      serializableMessages,
      state.step,
      state.bookType,
      state.selectedBookType,
      state.selectedTitle,
      state.selectedChapter,
      state.chapterCount,
      state.summary,
      state.refinedSummary,
      state.titleOptions,
      state.currentChapter,
      state.keyPoints,
      state.hasKeyPoints,
      state.outline,
      state.useCustomOutline,
      state.customOutline,
    ]
  );

  useDebouncedPersistence(Boolean(state.bookId), state.bookId, payload, 1000);

  // ---------------------- Handlers ----------------------
  const appendBotText = useCallback(
    (text) =>
      dispatch({
        type: "APPEND_MESSAGE",
        message: { id: generateId(), sender: "bot", text },
      }),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    dispatch({ type: "SET_FIELD", key: "input", value });
    dispatch({
      type: "SET_FIELD",
      key: "isMultiline",
      value: value.trim().length > 0,
    });
  };

  const ensureTitleInStorage = (id, title) => {
    if (!id || !title) return;
    const list = JSON.parse(localStorage.getItem("book_titles") || "[]");
    if (!list.find((b) => b.id === id)) {
      list.push({ id, title });
      localStorage.setItem("book_titles", JSON.stringify(list));
      window.dispatchEvent(new Event("titlesUpdated"));
    }
  };

  const handleTypeSelect = (type) => {
    dispatch({ type: "SET_FIELD", key: "bookType", value: type });
    dispatch({
      type: "SET_FIELD",
      key: "input",
      value: `I want to write a ${type}`,
    });
    inputRef.current?.focus();
  };

  const handleTitleSelect = (title) => {
    const clean = title.replace(/\*\*/g, "").trim();
    dispatch({ type: "SET_FIELD", key: "input", value: clean });
    inputRef.current?.focus();
  };

  const handleWriteOwnOutline = (chaps) => {
    dispatch({ type: "SET_FIELD", key: "useCustomOutline", value: true });
    dispatch({
      type: "SET_FIELD",
      key: "customOutline",
      value: getInitialCustomOutline(chaps),
    });
    appendBotText(
      `Great! Please create your own outline with **${chaps}** chapters. Enter a title for each chapter and optionally add a concept description.`
    );
    dispatch({ type: "SET_FIELD", key: "step", value: "customOutline" });
  };

  const handleOutlineDecision = async (useIt, chaptersArg = null) => {
    const outlineToUse = chaptersArg || state.outline;
    if (useIt) {
      const first = outlineToUse[0];
      if (!first) return;
      dispatch({
        type: "SET_FIELD",
        key: "selectedChapter",
        value: first.title || "",
      });
      dispatch({
        type: "SET_FIELD",
        key: "keyPoints",
        value: getInitialKeyPoints(state.bookType),
      });
      dispatch({ type: "SET_FIELD", key: "hasKeyPoints", value: false });
      dispatch({ type: "SET_FIELD", key: "step", value: "keypoints" });
      appendBotText(
        `Great! Let's start with \n Chapter 1: ${first.title} \n Concept: ${
          first.concept
        } \n Please enter ${getRequiredKeyPoints(
          state.bookType
        )} key points you'd like to include in this Chapter.`
      );
    } else {
      appendBotText(
        `How many chapters do you want in your ${
          state.bookType
        }? Usually this type has ${getChapterRange(state.bookType)} chapters.`
      );
      dispatch({ type: "SET_FIELD", key: "step", value: "chapters" });
      dispatch({ type: "SET_FIELD", key: "input", value: "" });
    }
  };

  const handleCustomOutlineChange = (index, field, value) => {
    const next = [...state.customOutline];
    next[index] = { ...next[index], [field]: value };
    dispatch({ type: "SET_FIELD", key: "customOutline", value: next });
  };

  const handleSubmitCustomOutline = () => {
    const filled = state.customOutline.filter((ch) => (ch.title || "").trim());
    const expectedCount = state.chapterCount || state.customOutline.length;
    if (filled.length < expectedCount) {
      appendBotText(`Please fill in all ${expectedCount} chapter titles.`);
      return;
    }
    dispatch({ type: "SET_FIELD", key: "outline", value: filled });

    const customOutlineMessage = {
      id: generateId(),
      sender: "user",
      text: "Here is my custom outline:",
      custom: (
        <div>
          <p style={{ color: "white" }}>
            <strong>Here is my custom outline:</strong>
          </p>
          <ol style={{ color: "white" }}>
            {filled.map((ch, idx) => (
              <li key={`${idx}-${ch.title}`}>
                <strong>{ch.title}</strong>
                <p className="mb-0" style={{ color: "white" }}>
                  {ch.concept}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ),
    };
    dispatch({ type: "APPEND_MESSAGE", message: customOutlineMessage });

    const first = filled[0];
    dispatch({ type: "SET_FIELD", key: "selectedChapter", value: first.title });
    appendBotText(
      `Perfect! Let's start with \n Chapter 1: ${first.title} \n Concept: ${
        first.concept
      } \n Please enter ${getRequiredKeyPoints(
        state.bookType
      )} key points you'd like to include in this Chapter.`
    );

    dispatch({
      type: "SET_FIELD",
      key: "keyPoints",
      value: getInitialKeyPoints(state.bookType),
    });
    dispatch({ type: "SET_FIELD", key: "step", value: "keypoints" });
    dispatch({ type: "SET_FIELD", key: "useCustomOutline", value: false });
    dispatch({ type: "SET_FIELD", key: "useSimpleInput", value: false });
  };

  const getOutlineSuggestions = async (count, oldOutline = null) => {
    let answer = "";
    const summaryToUse = state.refinedSummary || state.summary;

    if (Array.isArray(oldOutline) && oldOutline.length > 0) {
      const existing = oldOutline
        .map((ch) => `${ch.title}: ${ch.concept}`)
        .join("\n");
      answer = await askQuestion(
        `Generate a **completely NEW and UNIQUE** outline with ${count} chapters for the ${state.bookType} titled "${state.selectedTitle}", based on this summary: ${summaryToUse}\n\nPREVIOUS OUTLINE TO AVOID (do not repeat, rephrase, or use similar concepts):\n${existing}\n\nCRITICAL: Only output lines in this exact pattern for each chapter.\nChapter X: [Title]\n[Brief concept description in 1-2 lines]`
      );
    } else {
      answer = await askQuestion(
        `Create an outline for the ${state.bookType} titled "${state.selectedTitle}" based on this summary: ${summaryToUse}\n\nCRITICAL: Only output lines in this exact pattern for each chapter.\nChapter X: [Title]\n[Brief concept description in 1-2 lines]`
      );
    }

    const lines = answer
      .split(/\n|\r/)
      .map((l) => l.trim())
      .filter(Boolean);

    const chapters = [];
    let current = null;
    const isChapterLine = (l) =>
      /^(?:#+\s*)?(?:\d+\.\s*)?(?:chapter\s*\d+)/i.test(l);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isChapterLine(line)) {
        if (current) chapters.push(current);
        let rest = line
          .replace(/^(?:#+\s*)?(?:\d+\.\s*)?(?:chapter\s*\d+[:\.-]?\s*)/i, "")
          .replace(/\*\*/g, "")
          .trim();
        let title = rest;
        let concept = "";
        const sepMatch = rest.match(/[-:–]\s*(.*)/);
        if (sepMatch) {
          title = rest.slice(0, sepMatch.index).trim();
          concept = sepMatch[1].trim();
        }
        if (!concept && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (!isChapterLine(nextLine)) {
            concept = nextLine.replace(/\*\*/g, "").trim();
            i++;
          }
        }
        current = { title, concept };
      } else if (current && !current.concept) {
        current.concept = line.replace(/\*\*/g, "").trim();
      }
    }

    if (current) chapters.push(current);
    return chapters.slice(0, count);
  };

  const generateChapterContent = async (chapterTitle, providedKeyPoints) => {
    const loadingId = generateId();
    dispatch({
      type: "APPEND_MESSAGE",
      message: { id: loadingId, sender: "bot", text: "" },
    });

    try {
      const targetWords = (() => {
        switch (state.bookType) {
          case "Ebook":
            return 700;
          case "Short Book":
            return 1000;
          case "Full Length Book":
            return 1500;
          default:
            return 700;
        }
      })();

      let full = "";
      const previousParts = [];

      for (let partIndex = 0; partIndex < 4; partIndex++) {
        dispatch({
          type: "PATCH_MESSAGE_TEXT",
          id: loadingId,
          text: full + `\n\nGenerating Part ${partIndex + 1}/4...`,
        });

        const stream = await generateChapterStream({
          bookId: state.bookId,
          bookType: state.bookType,
          summary: state.summary,
          title: state.selectedTitle,
          chapterIndex: state.currentChapter,
          chapterTitle,
          keyPoints: providedKeyPoints ?? state.keyPoints,
          targetWordCount: targetWords,
          partIndex,
          previousParts: [...previousParts],
        });

        let partText = "";
        for await (const chunk of stream) {
          partText += chunk;
          dispatch({
            type: "PATCH_MESSAGE_TEXT",
            id: loadingId,
            text: full + partText,
          });
        }

        full += (partIndex > 0 ? "\n\n" : "") + partText;
        previousParts.push(partText);
        if (partIndex < 3) await new Promise((r) => setTimeout(r, 1000));
      }

      try {
        const res = await fetch("/api/book/save-chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: state.bookId,
            chapterIndex: state.currentChapter,
            chapterTitle,
            keyPoints: providedKeyPoints ?? state.keyPoints,
            aiContent: full,
          }),
        });
        if (!res.ok) console.error("Failed to save chapter to database");
      } catch (err) {
        console.error("Error saving chapter:", err);
      }

      dispatch({
        type: "REPLACE_MESSAGE",
        id: loadingId,
        message: {
          id: loadingId,
          sender: "bot",
          text: full,
          custom: formatMessageText(full, true),
        },
      });

      const next = state.currentChapter + 1;
      if (state.chapterCount && next <= state.chapterCount) {
        const nextTitle = state.outline[next - 1]?.title || `Chapter ${next}`;
        const nextConcept = state.outline[next - 1]?.concept || "";
        appendBotText(
          `Great! Let's work on Chapter ${next}: ${nextTitle} \n Concept: ${nextConcept} \n Please enter ${getRequiredKeyPoints(
            state.bookType
          )} key points you'd like to include in this Chapter:`
        );
        dispatch({ type: "SET_FIELD", key: "currentChapter", value: next });
        dispatch({
          type: "SET_FIELD",
          key: "selectedChapter",
          value: nextTitle,
        });
        dispatch({ type: "SET_FIELD", key: "hasKeyPoints", value: false });
        dispatch({
          type: "SET_FIELD",
          key: "keyPoints",
          value: getInitialKeyPoints(state.bookType),
        });
        dispatch({ type: "SET_FIELD", key: "step", value: "keypoints" });
      } else {
        appendBotText("🎉 Book generation complete!");
        dispatch({ type: "SET_FIELD", key: "step", value: "content" });
      }
    } catch (e) {
      dispatch({
        type: "REPLACE_MESSAGE",
        id: loadingId,
        message: {
          id: loadingId,
          sender: "bot",
          text: "Failed to generate chapter.",
        },
      });
    }
  };

  const sendMessage = async (overrideInput = null, overrideStep = null) => {
    const messageText = overrideInput ?? state.input;
    const currentStep = overrideStep ?? state.step;
    if (!messageText?.trim()) return;

    dispatch({
      type: "APPEND_MESSAGE",
      message: { id: generateId(), sender: "user", text: messageText },
    });
    dispatch({ type: "SET_FIELD", key: "input", value: "" });

    if (currentStep === "outline") {
      appendBotText("Please use the buttons above to continue.");
      return;
    }

    if (currentStep === "bookType") {
      dispatch({
        type: "APPEND_MESSAGE",
        message: createSummaryPromptMessage(generateId()),
      });
      dispatch({ type: "SET_FIELD", key: "step", value: "summary" });
      return;
    }

    if (currentStep === "summary") {
      dispatch({ type: "SET_FIELD", key: "summary", value: messageText });
      const loadingId = generateId();
      appendBotText("Generating title suggestions...");
      try {
        const userId = localStorage.getItem("userId") || null;
        const created = await createBook(messageText, userId);
        const newBookId = created._id;
        dispatch({ type: "SET_FIELD", key: "bookId", value: newBookId });

        const refined = await askQuestion(
          `Rewrite the following book summary in a single polished paragraph:\n${messageText}`
        );
        dispatch({ type: "SET_FIELD", key: "refinedSummary", value: refined });

        const answer = await askQuestion(
          `Generate 10 book title suggestions based on this summary. Format each as: "1. TITLE | SUBTITLE"\n\nSummary: ${messageText}`
        );
        const titles = answer
          .split(/\n|\r/)
          .map((t) => t.trim())
          .filter((t) => /^\d+\./.test(t))
          .map((t) => {
            const withoutNumber = t.replace(/^\d+\.\s*/, "").trim();
            const pipeMatch = withoutNumber.match(/^(.+?)\s*\|\s*(.+)$/);
            if (pipeMatch)
              return {
                title: pipeMatch[1].trim().replace(/\*\*/g, ""),
                subtitle: pipeMatch[2].trim().replace(/\*\*/g, ""),
              };
            const colonDashMatch = withoutNumber.match(
              /^(.+?)\s*[:\-–]\s*(.+)$/
            );
            if (colonDashMatch)
              return {
                title: colonDashMatch[1].trim().replace(/\*\*/g, ""),
                subtitle: colonDashMatch[2].trim().replace(/\*\*/g, ""),
              };
            return { title: withoutNumber.replace(/\*\*/g, "").trim() };
          })
          .filter((item) => item.title.length > 0);

        dispatch({ type: "SET_FIELD", key: "titleOptions", value: titles });
        dispatch({
          type: "APPEND_MESSAGE",
          message: createTitleSuggestionMessage(
            loadingId,
            refined,
            titles,
            messageText,
            handleTitleSelect,
            handleSummaryRegeneration
          ),
        });
      } catch (e) {
        appendBotText("Failed to fetch suggestions.");
      }
      dispatch({ type: "SET_FIELD", key: "step", value: "title" });
      return;
    }

    if (currentStep === "title") {
      const cleanTitle = messageText.replace(/\*\*/g, "").trim();
      dispatch({ type: "SET_FIELD", key: "selectedTitle", value: cleanTitle });
      if (!state.bookId) {
        console.error("Cannot save title: bookId is null");
      } else {
        try {
          await saveTitle(state.bookId, cleanTitle);
          ensureTitleInStorage(state.bookId, cleanTitle);
        } catch (e) {
          console.error(e);
        }
      }
      appendBotText(
        `How many chapters do you want in your ${
          state.selectedBookType || state.bookType
        }? Usually this type has ${getChapterRange(state.bookType)} chapters.`
      );
      dispatch({ type: "SET_FIELD", key: "step", value: "chapters" });
      return;
    }

    if (currentStep === "chapters") {
      const num = parseInt(messageText);
      if (!isNaN(num) && num > 0 && num <= 50) {
        dispatch({ type: "SET_FIELD", key: "chapterCount", value: num });
        appendBotText("Generating outline...");
        try {
          const outlineData = await getOutlineSuggestions(num, state.outline);
          dispatch({ type: "SET_FIELD", key: "outline", value: outlineData });
          const id = generateId();
          dispatch({
            type: "APPEND_MESSAGE",
            message: createOutlineMessage(
              id,
              outlineData,
              (ol) => handleOutlineDecision(true, ol),
              () => handleOutlineDecision(false),
              handleWriteOwnOutline
            ),
          });
          dispatch({ type: "SET_FIELD", key: "step", value: "outline" });
        } catch (e) {
          appendBotText("Failed to generate outline.");
        }
      } else {
        appendBotText("Please enter a valid number of chapters.");
      }
      return;
    }

    if (currentStep === "chapterTitle") {
      const chapterTitle = state.selectedChapter || messageText;
      if (!chapterTitle.trim()) return;
      if (!state.hasKeyPoints) {
        dispatch({
          type: "SET_FIELD",
          key: "selectedChapter",
          value: chapterTitle,
        });
        appendBotText(
          `Awesome! Now, please enter ${getRequiredKeyPoints(
            state.bookType
          )} key points you'd like to include in this Chapter:`
        );
        dispatch({
          type: "SET_FIELD",
          key: "keyPoints",
          value: getInitialKeyPoints(state.bookType),
        });
        dispatch({ type: "SET_FIELD", key: "step", value: "keypoints" });
        dispatch({ type: "SET_FIELD", key: "useSimpleInput", value: false });
      } else {
        dispatch({ type: "SET_FIELD", key: "isGenerating", value: true });
        await generateChapterContent(chapterTitle);
        dispatch({ type: "SET_FIELD", key: "isGenerating", value: false });
      }
      return;
    }

    if (currentStep === "keypoints" && state.useSimpleInput) {
      const simplePoints = messageText
        .split(/[;\n]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (simplePoints.length < getRequiredKeyPoints(state.bookType)) {
        appendBotText(
          `Please enter at least ${getRequiredKeyPoints(
            state.bookType
          )} key points.`
        );
        return;
      }
      const formatted = simplePoints
        .map((kp, i) => `${i + 1}. ${kp}`)
        .join("\n");
      dispatch({
        type: "APPEND_MESSAGE",
        message: {
          id: generateId(),
          sender: "user",
          text: `Here are my key points:\n${formatted}`,
        },
      });
      dispatch({ type: "SET_FIELD", key: "hasKeyPoints", value: true });
      dispatch({ type: "SET_FIELD", key: "keyPoints", value: simplePoints });
      dispatch({ type: "SET_FIELD", key: "isGenerating", value: true });
      await generateChapterContent(
        state.selectedChapter || messageText,
        simplePoints
      );
      dispatch({ type: "SET_FIELD", key: "isGenerating", value: false });
      return;
    }
  };

  // Key point helpers
  const handleKeyPointChange = (e, index) => {
    const next = [...state.keyPoints];
    next[index] = e.target.value;
    dispatch({ type: "SET_FIELD", key: "keyPoints", value: next });
  };

  const handleKeyPointEnter = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (state.keyPoints.length < 20 && index === state.keyPoints.length - 1) {
        const next = [...state.keyPoints, ""];
        dispatch({ type: "SET_FIELD", key: "keyPoints", value: next });
        setTimeout(() => {
          keyPointRefs.current[index + 1]?.focus();
        }, 50);
      } else if (keyPointRefs.current[index + 1]) {
        keyPointRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmitKeyPoints = async () => {
    const filled = state.keyPoints.filter((p) => p.trim() !== "");
    const needed = getRequiredKeyPoints(state.bookType);
    if (filled.length < needed) {
      appendBotText(`Please enter at least ${needed} key points.`);
      return;
    }
    const formatted = filled.map((kp, i) => `${i + 1}. ${kp}`).join("\n");
    dispatch({
      type: "APPEND_MESSAGE",
      message: {
        id: generateId(),
        sender: "user",
        text: `Here are my key points:\n${formatted}`,
      },
    });
    dispatch({ type: "SET_FIELD", key: "hasKeyPoints", value: true });
    dispatch({ type: "SET_FIELD", key: "keyPoints", value: filled });
    dispatch({ type: "SET_FIELD", key: "isGenerating", value: true });
    await generateChapterContent(state.selectedChapter || state.input);
    dispatch({ type: "SET_FIELD", key: "isGenerating", value: false });
  };

  const handleSkipKeyPoints = async () => {
    dispatch({
      type: "APPEND_MESSAGE",
      message: {
        id: generateId(),
        sender: "user",
        text: "Skip key points for this chapter",
      },
    });
    dispatch({ type: "SET_FIELD", key: "hasKeyPoints", value: false });
    dispatch({ type: "SET_FIELD", key: "isGenerating", value: true });
    await generateChapterContent(state.selectedChapter || state.input, []);
    dispatch({ type: "SET_FIELD", key: "isGenerating", value: false });
  };

  const handleSummaryRegeneration = async (
    originalSummary = null,
    currentRefined = null
  ) => {
    appendBotText("Generating new title suggestions...");
    const summaryToUse =
      originalSummary ||
      currentRefined ||
      state.refinedSummary ||
      state.summary;
    try {
      const refined = await askQuestion(
        `Take the following book summary and rewrite it in a completely different style and perspective. Use different vocabulary and emphasis. Keep a single polished paragraph.\n\nOriginal summary: ${summaryToUse}\n\nPrevious refined version to avoid repeating: ${
          currentRefined || state.refinedSummary || "None"
        }`
      );
      dispatch({ type: "SET_FIELD", key: "refinedSummary", value: refined });

      const existingTitles = state.titleOptions
        .map((t) => `${t.title}: ${t.subtitle || ""}`)
        .join("\n");
      const answer = await askQuestion(
        `Generate 10 completely NEW and UNIQUE book title suggestions with subtitles, not overlapping with these:\n${existingTitles}\n\nFormat as: "1. TITLE | SUBTITLE"\n\nBook summary: ${summaryToUse}`
      );

      const titles = answer
        .split(/\n|\r/)
        .map((t) => t.trim())
        .filter((t) => /^\d+\./.test(t))
        .map((t) => {
          const withoutNumber = t.replace(/^\d+\.\s*/, "").trim();
          const pipeMatch = withoutNumber.match(/^(.+?)\s*\|\s*(.+)$/);
          if (pipeMatch)
            return {
              title: pipeMatch[1].trim().replace(/\*\*/g, ""),
              subtitle: pipeMatch[2].trim().replace(/\*\*/g, ""),
            };
          const colonDashMatch = withoutNumber.match(/^(.+?)\s*[:\-–]\s*(.+)$/);
          if (colonDashMatch)
            return {
              title: colonDashMatch[1].trim().replace(/\*\*/g, ""),
              subtitle: colonDashMatch[2].trim().replace(/\*\*/g, ""),
            };
          return { title: withoutNumber.replace(/\*\*/g, "").trim() };
        })
        .filter((item) => item.title.length > 0);

      dispatch({ type: "SET_FIELD", key: "titleOptions", value: titles });
      dispatch({
        type: "APPEND_MESSAGE",
        message: createTitleSuggestionMessage(
          generateId(),
          refined,
          titles,
          summaryToUse,
          handleTitleSelect,
          handleSummaryRegeneration
        ),
      });
    } catch (e) {
      appendBotText("Failed to generate new suggestions.");
    }
  };

  const handleClearChat = () => {
    const fresh = {
      ...initialState,
      keyPoints: getInitialKeyPoints(state.bookType),
    };
    dispatch({ type: "INIT_FROM_STORAGE", payload: fresh });
    if (state.bookId) {
      saveChatState(state.bookId, {}).catch(() => {});
    }
  };

  // ---------------------- Render ----------------------
  return (
    <div className="d-flex flex-column chatScreen" style={{ height: "100vh" }}>
      {state.isLoadingChat && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {isFirstPrompt ? (
        <BookTypeSelector
          bookType={state.bookType}
          handleTypeSelect={handleTypeSelect}
          inputRef={inputRef}
          input={state.input}
          handleInputChange={handleInputChange}
          isMultiline={state.isMultiline}
          sendMessage={sendMessage}
        />
      ) : (
        <>
          <MessageList
            messages={state.messages}
            bottomRef={bottomRef}
            formatMessageText={formatMessageText}
          />

          {state.step === "customOutline" && !state.isGenerating ? (
            <CustomOutlineForm
              customOutline={state.customOutline}
              handleCustomOutlineChange={handleCustomOutlineChange}
              handleSubmitCustomOutline={handleSubmitCustomOutline}
              setUseCustomOutline={(v) =>
                dispatch({
                  type: "SET_FIELD",
                  key: "useCustomOutline",
                  value: v,
                })
              }
              setStep={(s) =>
                dispatch({ type: "SET_FIELD", key: "step", value: s })
              }
            />
          ) : state.step === "keypoints" && !state.isGenerating ? (
            state.useSimpleInput ? (
              <div className="p-3">
                <MainChatInput
                  inputRef={inputRef}
                  input={state.input}
                  isMultiline={state.isMultiline}
                  handleInputChange={handleInputChange}
                  sendMessage={sendMessage}
                  placeholder={`Enter ${getRequiredKeyPoints(
                    state.bookType
                  )} key points separated by semicolons`}
                />
                <div className="mt-2 text-end">
                  <button
                    className="btn-toggle-input"
                    onClick={handleSkipKeyPoints}
                  >
                    Skip this step
                  </button>
                </div>
              </div>
            ) : (
              <KeypointInputForm
                keyPoints={state.keyPoints}
                handleKeyPointChange={handleKeyPointChange}
                handleKeyPointEnter={handleKeyPointEnter}
                keyPointRefs={keyPointRefs}
                getRequiredKeyPoints={() =>
                  getRequiredKeyPoints(state.bookType)
                }
                handleSubmitKeyPoints={handleSubmitKeyPoints}
                handleSkipKeyPoints={handleSkipKeyPoints}
                setUseSimpleInput={(v) =>
                  dispatch({
                    type: "SET_FIELD",
                    key: "useSimpleInput",
                    value: v,
                  })
                }
              />
            )
          ) : state.step === "outline" ||
            state.step === "customOutline" ? null : (
            <div className="p-3">
              <MainChatInput
                inputRef={inputRef}
                input={state.input}
                isMultiline={state.isMultiline}
                handleInputChange={handleInputChange}
                sendMessage={sendMessage}
                placeholder="Type your message..."
              />
            </div>
          )}

          <ClearChatButton onClick={handleClearChat} />
        </>
      )}
    </div>
  );
}
