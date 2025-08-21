import React from 'react';

export default function CustomOutlineForm({
  customOutline,
  handleCustomOutlineChange,
  handleSubmitCustomOutline,
  setUseCustomOutline,
  setStep,
}) {
  return (
    <div className="p-3 keypointBg">
      <div className="scrollable-keypoints mb-2">
        {customOutline.map((chapter, idx) => (
          <div key={idx} className="mb-3">
            <label className="form-label text-dark">Chapter {idx + 1}</label>
            <input
              type="text"
              className="keypoint-input mb-2"
              value={chapter.title}
              placeholder={`Chapter ${idx + 1} Title`}
              onChange={(e) => handleCustomOutlineChange(idx, 'title', e.target.value)}
            />
            <textarea
              className="keypoint-input"
              value={chapter.concept}
              placeholder={`Chapter ${idx + 1} Concept (optional)`}
              onChange={(e) => handleCustomOutlineChange(idx, 'concept', e.target.value)}
              rows={3}
            />
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-between">
        <button className="btn-chat" onClick={handleSubmitCustomOutline}>
          Submit Custom Outline
        </button>
        <button className="btn-toggle-input" onClick={() => {
          setUseCustomOutline(false);
          setStep('outline');
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
