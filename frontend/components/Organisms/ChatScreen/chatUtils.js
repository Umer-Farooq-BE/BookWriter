import React from "react";
import { formatChapterText } from "../../../utils/format";

export const formatMessageText = (text, doubleSpace = false) => {
  if (!text || typeof text !== "string") return text;

  let sanitized = formatChapterText(text, doubleSpace);

  // Remove ** markers that were added by formatChapterText but preserve the text
  sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, "$1");

  // Match lines that start with "1. ", "2. ", etc.
  const numberedListRegex = /^(\d+\.\s.*)$/gm;
  const parts = sanitized.split(numberedListRegex);
  const isNumberedItem = /^\d+\.\s.*$/;

  return (
    <>
      {parts.map((part, idx) =>
        isNumberedItem.test(part.trim()) ? (
          <React.Fragment key={idx}>
            {part}
            <br />
          </React.Fragment>
        ) : (
          part.split(/\n/).map((line, jdx) => {
            if (!line.trim()) return null;
            const cleaned = line.replace(/\*\*/g, "").trim();
            if (/^Chapter\s*\d+/i.test(cleaned)) {
              return (
                <React.Fragment key={`${idx}-${jdx}`}>
                  <strong style={{ fontWeight: "bold" }}>{cleaned}</strong>
                  <br />
                </React.Fragment>
              );
            }

            // Check for part titles with !!! markers
            if (cleaned.includes("!!!")) {
              const match = cleaned.match(/^(.*?)!!!\s*([^!]+?)\s*!!!(.*?)$/);
              if (match) {
                const beforeTitle = match[1].trim();
                const partTitle = match[2].trim();
                const afterTitle = match[3].trim();

                return (
                  <React.Fragment key={`${idx}-${jdx}`}>
                    {beforeTitle && (
                      <>
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {beforeTitle}
                        </span>
                        <br />
                      </>
                    )}
                    <br />
                    <strong style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {partTitle}
                    </strong>
                    <br />
                    <br />
                    {afterTitle && (
                      <>
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {afterTitle}
                        </span>
                        <br />
                      </>
                    )}
                  </React.Fragment>
                );
              }
            }

            // Check if line is already formatted with ** (from utils/format.ts)
            if (cleaned.startsWith("**") && cleaned.endsWith("**")) {
              const boldText = cleaned.slice(2, -2); // Remove ** markers
              return (
                <React.Fragment key={`${idx}-${jdx}`}>
                  <br />
                  <strong style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                    {boldText}
                  </strong>
                  <br />
                  <br />
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={`${idx}-${jdx}`}>
                <span style={{ whiteSpace: "pre-wrap" }}>{cleaned}</span>
                <br />
              </React.Fragment>
            );
          })
        )
      )}
    </>
  );
};
