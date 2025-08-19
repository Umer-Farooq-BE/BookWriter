import React from 'react';

export default function KeypointInputForm({
  keyPoints,
  handleKeyPointChange,
  handleKeyPointEnter,
  keyPointRefs,
  getRequiredKeyPoints,
  handleSubmitKeyPoints,
  handleSkipKeyPoints,
  setUseSimpleInput,
}) {
  return (
    <div className="p-3 keypointBg">
      <p className="text-dark mb-2">Please enter {getRequiredKeyPoints()} key points you'd like to include in this chapter:</p>
      <div className="scrollable-keypoints mb-2">
        {keyPoints.map((point, idx) => (
          <input
            key={idx}
            type="text"
            className="keypoint-input"
            value={point}
            placeholder={`Key Point ${idx + 1}`}
            onChange={(e) => handleKeyPointChange(e, idx)}
            onKeyDown={(e) => handleKeyPointEnter(e, idx)}
            ref={(el) => (keyPointRefs.current[idx] = el)}
          />
        ))}
      </div>
      <div className="d-flex justify-content-between">
        <button className="btn-chat" onClick={handleSubmitKeyPoints}>
          Submit Key Points
        </button>
        <div className="d-flex gap-2">
          <button className="btn-toggle-input" onClick={() => setUseSimpleInput(true)}>
            Use simple input
          </button>
          <button className="btn-toggle-input" onClick={handleSkipKeyPoints}>
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );
}
