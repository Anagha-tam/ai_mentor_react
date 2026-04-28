import { useEffect, useMemo, useState } from "react";

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
  assessmentStatuses = [],
  assessmentLoading,
  onTakeChapterAssessment,
  weeklyStudyHours = [],
}) {
  const [currentView, setCurrentView] = useState("chat");
  const [collapsedChapters, setCollapsedChapters] = useState({});
  useEffect(() => {
    const chapters = studyProgress?.studyMaterialId?.chapters;
    if (!Array.isArray(chapters) || chapters.length === 0) return;
    const activeChapterIndex = Number(studyProgress?.currentChapterIndex || 0);
    setCollapsedChapters((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next = {};
      chapters.forEach((_, idx) => {
        next[idx] = idx !== activeChapterIndex;
      });
      return next;
    });
  }, [studyProgress]);
  const plannerData = useMemo(() => {
    const now = new Date();
    const monthLabel = now.toLocaleString("en-US", { month: "short", year: "numeric" });
    const days = Array.from({ length: 6 }, (_, idx) => {
      const date = new Date(now);
      date.setDate(now.getDate() + idx);
      return {
        key: date.toISOString(),
        label: date.toLocaleString("en-US", { weekday: "short" }),
        dayNumber: date.getDate(),
        isToday: idx === 0,
      };
    });
    return { monthLabel, days };
  }, []);
  const currentChapterIndex = Number(studyProgress?.currentChapterIndex || 0);
  const currentTopicIndex = Number(studyProgress?.currentTopicIndex || 0);
  const currentSubject = String(studyProgress?.studyMaterialId?.subject || "").trim();
  const currentChapter = studyProgress?.studyMaterialId?.chapters?.[currentChapterIndex] || null;
  const totalChapters = Array.isArray(studyProgress?.studyMaterialId?.chapters)
    ? studyProgress.studyMaterialId.chapters.length
    : 0;
  const sessionTitle = currentSubject ? `${currentSubject} Mentor` : "AI Mentor";
  const sessionSubtitle =
    totalChapters > 0
      ? `${totalChapters} chapter${totalChapters === 1 ? "" : "s"} in your study plan`
      : "Candidate guidance and doubt-clearing session";
  const dashboardSubtitle = currentSubject ? `${currentSubject} analytics` : "Session analytics";
  const roadmapSubtitle = currentSubject ? `${currentSubject} plan` : "Study plan";
  const chatPlaceholder = currentSubject ? `Ask your ${currentSubject} question...` : "Type your message...";
  const chapterTopics = Array.isArray(currentChapter?.topics) ? currentChapter.topics : [];
  const todaysWindowStart = Math.max(0, currentTopicIndex - 1);
  const todaysTaskItems = chapterTopics.slice(todaysWindowStart, todaysWindowStart + 3).map((topic, idx) => {
    const absoluteTopicIndex = todaysWindowStart + idx;
    const status =
      absoluteTopicIndex < currentTopicIndex ? "done" : absoluteTopicIndex === currentTopicIndex ? "current" : "upcoming";
    return {
      id: topic?._id || `${currentChapterIndex}-${absoluteTopicIndex}`,
      title: topic?.title || `Topic ${absoluteTopicIndex + 1}`,
      status,
    };
  });
  const todaysTaskDoneCount = todaysTaskItems.filter((task) => task.status === "done").length;
  const todaysTaskProgressPct =
    todaysTaskItems.length > 0 ? Math.round((todaysTaskDoneCount / todaysTaskItems.length) * 100) : 0;
  const streakDays = useMemo(() => {
    if (!Array.isArray(weeklyStudyHours) || weeklyStudyHours.length === 0) return 0;
    let count = 0;
    for (let i = weeklyStudyHours.length - 1; i >= 0; i -= 1) {
      const secs = Number(weeklyStudyHours[i]?.seconds || 0);
      if (secs > 0) {
        count += 1;
        continue;
      }
      break;
    }
    return count;
  }, [weeklyStudyHours]);
  const toggleChapterCollapse = (chapterIndex) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterIndex]: !prev[chapterIndex],
    }));
  };
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
              <p>{sessionTitle}</p>
              <span>{sessionSubtitle}</span>
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
              <div className="planner-head"><p>Planner</p><span>{plannerData.monthLabel}</span></div>
              <div className="planner-grid">
                {plannerData.days.map((day) => (
                  <div key={day.key} className={`planner-day ${day.isToday ? "active" : ""}`}>
                    <small>{day.label}</small>
                    <strong>{day.dayNumber}</strong>
                  </div>
                ))}
              </div>
              <div className="planner-tasks">
                <p className="planner-tasks-title">Today's Tasks</p>
                <div className="planner-progress-wrap">
                  <div className="planner-progress-label">
                    <span>
                      {todaysTaskDoneCount}/{todaysTaskItems.length || 0} tasks done
                    </span>
                    <strong>{todaysTaskProgressPct}%</strong>
                  </div>
                  <div className="planner-progress-bar">
                    <div className="planner-progress-fill" style={{ width: `${todaysTaskProgressPct}%` }} />
                  </div>
                </div>
                {todaysTaskItems.length > 0 ? (
                  <div className="planner-task-list">
                    {todaysTaskItems.map((task) => (
                      <div key={task.id} className={`planner-task-item ${task.status}`}>
                        <span className="planner-task-bullet">
                          {task.status === "done" ? "✓" : task.status === "current" ? "●" : "○"}
                        </span>
                        <span className="planner-task-text">{task.title}</span>
                        <span className={`planner-task-state ${task.status}`}>
                          {task.status === "done" ? "Done" : task.status === "current" ? "In Progress" : "Next"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="planner-task-empty">No tasks yet. Start a chapter to see today's task plan.</p>
                )}
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
                }} placeholder={chatPlaceholder} />
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

          <div className="study-roadmap-sidebar">
            <div className="sidebar-header">
              <h3>Study Plan</h3>
              <span>{studyProgress?.studyMaterialId?.subject}</span>
            </div>
            <div className="sidebar-content">
              {studyProgress?.studyMaterialId?.chapters?.map((chapter, cIdx) => {
                const isChapterActive = cIdx === studyProgress.currentChapterIndex;
                const isChapterDone = cIdx < studyProgress.currentChapterIndex;
                const isCollapsed = Boolean(collapsedChapters[cIdx]);

                return (
                  <div key={cIdx} className={`sidebar-chapter ${isChapterActive ? "active" : ""} ${isChapterDone ? "done" : ""}`}>
                    <div
                      className="sidebar-chapter-title"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleChapterCollapse(cIdx)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleChapterCollapse(cIdx);
                        }
                      }}
                    >
                      <div className="chapter-title-main">
                        <span>{chapter.chapterTitle}</span>
                      </div>
                      <span className="chapter-collapse-icon">{isCollapsed ? "▸" : "▾"}</span>
                      <div className="chapter-actions">
                        {(() => {
                          const status = assessmentStatuses.find((s) => s.chapterIndex === cIdx);
                          if (status) {
                            return (
                              <>
                                <span className="status-badge attended">✓ {status.score}/10</span>
                                <button className="retake-btn" onClick={() => onTakeChapterAssessment(cIdx)}>Retake</button>
                              </>
                            );
                          }
                          return (
                            <button className="take-btn" onClick={() => onTakeChapterAssessment(cIdx)}>Assessment</button>
                          );
                        })()}
                      </div>
                    </div>
                    <div className={`sidebar-topics-list ${isCollapsed ? "collapsed" : ""}`}>
                      {chapter.topics?.map((topic, tIdx) => {
                        const isTopicActive = isChapterActive && tIdx === studyProgress.currentTopicIndex;
                        const isTopicDone = isChapterDone || (isChapterActive && tIdx < studyProgress.currentTopicIndex);

                        return (
                          <div key={tIdx} className={`sidebar-topic-item ${isTopicActive ? "active" : ""} ${isTopicDone ? "done" : ""}`}>
                            <div className="topic-status-icon">
                              {isTopicDone ? "✓" : isTopicActive ? "●" : "○"}
                            </div>
                            <div className="topic-title">{topic.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="planner-weekly-hours">
                <div className="planner-weekly-head">
                  <p>Weekly Hours</p>
                  <span>
                    {(weeklyStudyHours.reduce((sum, item) => sum + Number(item.seconds || 0), 0) / 3600).toFixed(1)}h
                  </span>
                </div>
                <div className="planner-weekly-bars">
                  {weeklyStudyHours.map((entry) => {
                    const maxSeconds = Math.max(1, ...weeklyStudyHours.map((item) => Number(item.seconds || 0)));
                    const heightPct = Math.max(8, Math.round((Number(entry.seconds || 0) / maxSeconds) * 100));
                    const hoursLabel = (Number(entry.seconds || 0) / 3600).toFixed(1);
                    return (
                      <div key={entry.key || entry.day} className="planner-weekly-bar-col">
                        <div className="planner-weekly-bar-wrap">
                          <div className="planner-weekly-bar" style={{ height: `${heightPct}%` }} title={`${hoursLabel}h`} />
                        </div>
                        <small>{entry.day}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="sidebar-streak-card">
                <div className="sidebar-streak-icon">🔥</div>
                <div>
                  <strong>{streakDays} {streakDays === 1 ? "Day" : "Days"}</strong>
                  <span>{streakDays > 0 ? "Study Streak" : "Start your streak today"}</span>
                </div>
              </div>
              <div className="sidebar-quick-actions-card">
                <h4>Quick Actions</h4>
                <div className="sidebar-quick-actions-list">
                  <button type="button" onClick={() => setCurrentView("roadmap")}>View Study Plan</button>
                  <button type="button" onClick={() => onTakeChapterAssessment(currentChapterIndex)}>
                    Take Assessment
                  </button>
                  <button type="button" onClick={interruptAi}>Review Mistakes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`alt-view ${currentView === "dashboard" ? "" : "view-hidden"}`}>
            <div className="alt-header">
              <h2>Dashboard</h2>
              <span>{dashboardSubtitle}</span>
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
              <span>{roadmapSubtitle}</span>
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
                  <strong>No study plan yet</strong>
                  <p>Complete onboarding and generate a plan to start tracking progress.</p>
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
                  <div className="assessment-result-summary">
                    {assessmentModal.type === "chapter" ? (
                      <p>Assessment submitted successfully! Check your status in the sidebar.</p>
                    ) : (
                      <span>Assessment submitted. You can close this window.</span>
                    )}
                    <button className="assessment-submit" onClick={onCloseAssessment}>Close</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        
        {assessmentLoading ? (
          <div className="assessment-loading-overlay">
            <div className="assessment-loading-content">
              <div className="loader-spinner" />
              <p>Preparing your AI assessment...</p>
              <span>Our AI is generating 10 specific questions for this chapter.</span>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
