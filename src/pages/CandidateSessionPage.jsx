import { useState } from "react";

export function CandidateSessionPage({
  sessionEndedScreen,
  interruptAi,
  disconnectAndLogout,
  sessionTimer,
  avatarContainerRef,
  avatarLoading,
  camOn,
  camVideoRef,
  status,
  avatarLoaderStep,
  avatarLoaderSteps,
  avatarLoaderStatus,
  visibleMessages,
  userMessageCount,
  transcriptBodyRef,
  avatarReady,
  aiSpeaking,
  handleTalkPointerDown,
  handleTalkPointerUp,
  endConversation,
  endingConversation,
  liveSttText,
  socketError,
  chatInput,
  onChatInputChange,
  onSendTextMessage,
  assessmentModal,
  assessmentAnswers,
  assessmentSubmitted,
  onAssessmentAnswer,
  onSubmitAssessment,
  onCloseAssessment,
  studyProgress,
}) {
  const [currentView, setCurrentView] = useState("chat");
  if (sessionEndedScreen) {
    return (
      <main className="interview-root">
        <div className="session-ended-wrap">
          <div className="session-ended-card">
            <h2>AI mentor session completed</h2>
            <p>You can close this window.</p>
            <button className="icon-btn danger" onClick={disconnectAndLogout}>
              Back to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mentor-shell">
      <aside className="mentor-rail">
        <div className="mentor-rail-top">
          <button
            className={`mentor-rail-btn ${currentView === "chat" ? "active" : ""}`}
            type="button"
            onClick={() => setCurrentView("chat")}
          >
            💬
          </button>
          <button
            className={`mentor-rail-btn ${currentView === "dashboard" ? "active" : ""}`}
            type="button"
            onClick={() => setCurrentView("dashboard")}
          >
            📊
          </button>
          <button
            className={`mentor-rail-btn ${currentView === "roadmap" ? "active" : ""}`}
            type="button"
            onClick={() => setCurrentView("roadmap")}
          >
            🗺
          </button>
        </div>
        <div className="mentor-rail-bottom">
          <button className="mentor-rail-btn danger" type="button" onClick={disconnectAndLogout}>⎋</button>
        </div>
      </aside>
      <section className="interview-root">
        <div className="topbar">
          <div className="topbar-left">
            <div className="brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M2 8l10 6 10-6" />
              </svg>
            </div>
            <div className="session-info">
              <p>AI Mentor</p>
              <span>Candidate guidance and doubt-clearing session</span>
            </div>
          </div>
          <div className="live-dot">
            <div className="dot-pulse" />
            Live <span className="session-timer">{sessionTimer}</span>
          </div>
            <div className="topbar-right">
              <button className="icon-btn" onClick={interruptAi}>Interrupt</button>
              <button className="icon-btn danger" onClick={disconnectAndLogout}>Logout</button>
            </div>
          </div>
          {studyProgress && (
            <div className="session-progress-strip">
              <div className="progress-info">
                <span className="topic-name">
                  Chapter {studyProgress.currentChapterIndex + 1}: {studyProgress.studyMaterialId?.chapters?.[studyProgress.currentChapterIndex]?.chapterTitle || "Loading..."}
                </span>
                <span className="topic-sub">
                  Topic: {studyProgress.studyMaterialId?.chapters?.[studyProgress.currentChapterIndex]?.topics?.[studyProgress.currentTopicIndex]?.title || "Loading..."}
                </span>
              </div>
              <div className="progress-bar-rail">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.round(((studyProgress.currentTopicIndex + 1) / (studyProgress.studyMaterialId?.chapters?.[studyProgress.currentChapterIndex]?.topics?.length || 1)) * 100)}%` }} 
                />
              </div>
            </div>
          )}
          <div className={`main-content anagha-layout ${currentView === "chat" ? "" : "view-hidden"}`}>
          <div className="left-stack">
            <div className="video-card">
              <div className="video-inner">
                <div ref={avatarContainerRef} className="avatar-host" />
                {avatarLoading ? (
                  <div className="av-loader-wrap">
                    <div className="av-logo-ring">
                      <div className="av-ring-outer" />
                      <div className="av-ring-spin" />
                      <div className="av-ring-spin2" />
                      <div className="av-logo-inner">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7f77dd" strokeWidth="1.5">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="av-loader-title">Setting up your AI mentor session</div>
                    <div className="av-steps">
                      {avatarLoaderSteps.map((label, index) => (
                        <div key={label} className="av-step">
                          <div className={`av-step-dot ${index < avatarLoaderStep ? "done" : index === avatarLoaderStep ? "active" : "pending"}`} />
                          <span className={`av-step-label ${index < avatarLoaderStep ? "done" : index === avatarLoaderStep ? "active" : "pending"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="av-status-msg">{avatarLoaderStatus[avatarLoaderStep]}</div>
                  </div>
                ) : null}
                <div className={`pip-cam ${camOn ? "cam-on" : ""}`}>
                  {camOn ? <video ref={camVideoRef} className="pip-cam-video" autoPlay muted playsInline /> : <span className="pip-cam-label">Audio only</span>}
                </div>
              </div>
            </div>
            <div className="planner-card">
              <div className="planner-head"><p>Planner</p><span>Apr 2026</span></div>
              <div className="planner-grid">
                {["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                  <div key={d} className={`planner-day ${i === 0 ? "active" : ""}`}><small>{d}</small><strong>{21 + i}</strong></div>
                ))}
              </div>
              <div className="planner-note">Hold Space or the mic button to talk.</div>
            </div>
          </div>
          <div className="right-col">
            <div className="transcript-card">
              <div className="transcript-header">
                <p>Conversation transcript</p>
                <span>{visibleMessages.length} messages · {userMessageCount} user turns</span>
              </div>
              <div ref={transcriptBodyRef} className="transcript-body">
                {!avatarReady ? <p className="empty">Transcript will appear once avatar is ready.</p> : null}
                {avatarReady && visibleMessages.length === 0 ? <p className="empty">No conversation yet.</p> : null}
                {visibleMessages.map((message) => {
                  const isUser = message.role === "user";
                  const isAi = message.role === "ai";
                  return (
                    <div key={message.id} className={`msg ${isUser ? "right" : ""}`}>
                      <span className={`msg-label ${isAi ? "ai" : isUser ? "user" : "system"}`}>{isAi ? "AI mentor" : isUser ? "You" : "System"}</span>
                      <div className={`msg-bubble ${isAi ? "ai" : isUser ? "user" : "system"}`}>{message.text}</div>
                    </div>
                  );
                })}
                {avatarReady && aiSpeaking ? <div className="typing"><span /><span /><span /></div> : null}
              </div>
            </div>
            <div className="controls-bar">
              <div className="chat-input-row in-controls">
                <input className="chat-input" type="text" value={chatInput} onChange={onChatInputChange} onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSendTextMessage();
                  }
                }} placeholder="Type your message..." />
                <button className="chat-send-btn" onClick={onSendTextMessage} disabled={!chatInput?.trim()}>Send</button>
              </div>
              <button className={`ptalk-btn ${status === "listening" ? "talking" : ""}`} onPointerDown={handleTalkPointerDown} onPointerUp={handleTalkPointerUp} onPointerCancel={handleTalkPointerUp}>
                <span>{status === "listening" ? "Listening" : "Talk"}</span>
              </button>
              <button className="end-btn" onClick={endConversation} disabled={endingConversation}>{endingConversation ? "Ending..." : "End call"}</button>
            </div>
            <p className="status-note">Tip: Hold the Talk button or Space to speak, then release to send.</p>
            {liveSttText ? <p className="status-note">{liveSttText}</p> : null}
            {socketError ? <p className="error-note">{socketError}</p> : null}
          </div>
        </div>
        <div className={`alt-view ${currentView === "dashboard" ? "" : "view-hidden"}`}>
            <div className="alt-header">
              <h2>Dashboard</h2>
              <span>Session analytics</span>
            </div>
            <div className="dash-grid">
              <div className="dash-card">
                <small>Session time</small>
                <strong>{sessionTimer}</strong>
              </div>
              <div className="dash-card">
                <small>Total messages</small>
                <strong>{visibleMessages.length}</strong>
              </div>
              <div className="dash-card">
                <small>Your turns</small>
                <strong>{userMessageCount}</strong>
              </div>
              <div className="dash-card">
                <small>Status</small>
                <strong>{status === "listening" ? "Listening" : "Connected"}</strong>
              </div>
            </div>
          </div>
        <div className={`alt-view ${currentView === "roadmap" ? "" : "view-hidden"}`}>
            <div className="alt-header">
              <h2>Roadmap</h2>
              <span>{studyProgress?.studyMaterialId?.subject || "Interview prep"} plan</span>
            </div>
            <div className="roadmap-list">
              {studyProgress?.studyMaterialId?.chapters?.map((chapter, cIdx) => {
                const isDone = cIdx < studyProgress.currentChapterIndex;
                const isActive = cIdx === studyProgress.currentChapterIndex;
                return (
                  <div key={chapter._id || cIdx} className={`roadmap-item ${isDone ? "done" : isActive ? "active" : ""}`}>
                    <strong>Chapter {cIdx + 1}: {chapter.chapterTitle}</strong>
                    <p>{chapter.topics?.length || 0} topics included.</p>
                    {isActive && (
                      <ul className="roadmap-topics">
                        {chapter.topics?.map((topic, tIdx) => (
                          <li key={tIdx} className={tIdx <= studyProgress.currentTopicIndex ? "topic-done" : ""}>
                            {tIdx === studyProgress.currentTopicIndex ? "→ " : ""}{topic.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {!studyProgress && (
                <div className="roadmap-item active">
                  <strong>Standard Prep</strong>
                  <p>Follow the AI mentor's guided questions.</p>
                </div>
              )}
            </div>
          </div>
        {assessmentModal?.open ? (
          <div className="assessment-overlay">
            <div className="assessment-modal">
              <div className="assessment-head">
                <h3>{assessmentModal.title || "Assessment"}</h3>
                <button className="assessment-close" onClick={onCloseAssessment} type="button">
                  Close
                </button>
              </div>
              <p className="assessment-instructions">Choose one option for each question.</p>
              <div className="assessment-body">
                {(assessmentModal.questions || []).map((item, index) => (
                  <div key={item.id || index} className="assessment-question">
                    <p>
                      {index + 1}. {item.question}
                    </p>
                    <div className="assessment-options">
                      {(item.options || []).map((option) => {
                        const selected = assessmentAnswers?.[item.id] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`assessment-option ${selected ? "selected" : ""}`}
                            onClick={() => onAssessmentAnswer(item.id, option)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="assessment-footer">
                {!assessmentSubmitted ? (
                  <button className="assessment-submit" type="button" onClick={onSubmitAssessment}>
                    Submit
                  </button>
                ) : (
                  <span>Assessment submitted. You can close this window.</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
