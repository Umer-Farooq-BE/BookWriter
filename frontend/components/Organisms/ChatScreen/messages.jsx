export function createTitleSuggestionMessage(
  id,
  refined,
  titles,
  originalSummary,
  onSelect,
  onRegenerate
) {
  return {
    id,
    sender: "bot",
    customType: "titleSuggestions",
    data: { refinedSummary: refined, titles, originalSummary },
    custom: (
      <div>
        <p>
          Great! Here is the refined version of your summary: <br />
          <br />
          <span style={{ fontStyle: "italic" }}>&quot;{refined}&quot;</span>
          <br />
          <br />
          <strong>
            Based on your summary, here are some title ideas—choose one or enter
            your own book title:
          </strong>
        </p>
        <ul className="list-unstyled d-flex flex-wrap gap-2">
          {titles.map((t, idx) => (
            <li key={`${idx}-${t.title}`} className="title-suggestion">
              <button className="selection" onClick={() => onSelect(t.title)}>
                <div className="title-container">
                  <div className="main-title">{t.title}</div>
                  {t.subtitle && <div className="subtitle">{t.subtitle}</div>}
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="d-flex gap-2 mt-2">
          <button
            className="selection regeneration"
            onClick={() => onRegenerate(originalSummary, refined)}
          >
            Generate another suggestion
          </button>
        </div>
      </div>
    ),
  };
}

export function createOutlineMessage(id, outlineData, onAccept, onReject, onWriteOwn) {
  return {
    id,
    sender: "bot",
    customType: "outline",
    data: { outline: outlineData },
    custom: (
      <div>
        <p>Here is a suggested outline for chapters and their contents:</p>
        <ol>
          {outlineData.map((ch, idx) => (
            <li key={`${idx}-${ch.title}`}>
              <strong>{ch.title}</strong>
              <p className="mb-0">{ch.concept}</p>
            </li>
          ))}
        </ol>
        <div className="d-flex gap-2 mt-2">
          <button className="selection" onClick={() => onAccept(outlineData)}>
            Go ahead with this
          </button>
          <button className="selection regeneration" onClick={onReject}>
            Generate another suggestion
          </button>
          <button
            className="selection"
            onClick={() => onWriteOwn(outlineData.length)}
          >
            Write your own outline
          </button>
        </div>
      </div>
    ),
  };
}

export function createSummaryPromptMessage(id) {
  return {
    id,
    sender: "bot",
    customType: "summaryPrompt",
    custom: (
      <div>
        <p>
          Great! To get started, I’ll need a brief book summary—just 3 to 6
          sentences that describe the main message or journey you want to share
          in your book.
        </p>
        <p>Once you provide that, I’ll:</p>
        <ul className="d-flex flex-column flex-wrap gap-2">
          <li>Refine your summary into a clean and compelling version.</li>
          <li>Give you 10 title and subtitle suggestions to consider.</li>
          <li>Help you develop chapter ideas and an outline if you’d like.</li>
        </ul>
        <strong>
          👉 Please type or paste your book summary when you're ready.
        </strong>
      </div>
    ),
  };
}