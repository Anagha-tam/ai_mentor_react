import { useEffect, useMemo, useState } from "react";

export function CandidateSessionPage({
  sessionEndedScreen,
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
  reviewLoading,
  onTakeChapterAssessment,
  onReviewChapterMistakes,
  reviewToast,
  onDismissReviewToast,
  weeklyStudyHours = [],
}) {
  const [currentView, setCurrentView] = useState("chat");
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [accuracyHoverIndex, setAccuracyHoverIndex] = useState(null);
  const resolvedStudyMaterial = useMemo(() => {
    const material = studyProgress?.studyMaterialId;
    if (material && typeof material === "object" && Array.isArray(material.chapters)) {
      return material;
    }
    const plan = studyProgress?.studyPlanId;
    if (plan && typeof plan === "object" && Array.isArray(plan.weeks)) {
      return {
        _id: plan._id,
        subject: plan.planName || "General Plan",
        chapters: plan.weeks.map((week, weekIdx) => ({
          _id: week?._id || `week-${weekIdx + 1}`,
          chapterNumber: Number(week?.weekNumber || weekIdx + 1),
          chapterTitle: String(week?.title || `Week ${weekIdx + 1}`),
          topics: (Array.isArray(week?.topics) ? week.topics : []).map((topic, topicIdx) => ({
            _id: `${week?._id || `week-${weekIdx + 1}`}-topic-${topicIdx}`,
            title: String(topic || ""),
          })),
        })),
      };
    }
    return null;
  }, [studyProgress]);
  const getLocalDateKey = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
    const chapters = resolvedStudyMaterial?.chapters;
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
  }, [studyProgress, resolvedStudyMaterial]);
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
  const currentSubject = String(resolvedStudyMaterial?.subject || "").trim();
  const currentChapter = resolvedStudyMaterial?.chapters?.[currentChapterIndex] || null;
  const totalChapters = Array.isArray(resolvedStudyMaterial?.chapters)
    ? resolvedStudyMaterial.chapters.length
    : 0;
  const sessionTitle = currentSubject ? `${currentSubject} Mentor` : "AI Mentor";
  const dashboardSubtitle = currentSubject ? `${currentSubject} analytics` : "Session analytics";
  const roadmapSubtitle = currentSubject ? `${currentSubject} plan` : "Study plan";
  const chatPlaceholder = currentSubject ? `Ask your ${currentSubject} question...` : "Type your message...";
  const chapterTopics = Array.isArray(currentChapter?.topics) ? currentChapter.topics : [];
  const daySlotInWeek = (new Date().getDay() + 6) % 7;
  const mappedTopicIndexForToday =
    chapterTopics.length > 0 ? Math.min(chapterTopics.length - 1, Math.floor((daySlotInWeek * chapterTopics.length) / 7)) : 0;
  const todayTopicIndex = mappedTopicIndexForToday;
  const todayTopic = chapterTopics[todayTopicIndex] || null;
  const todaysTaskItems = todayTopic
    ? [
        {
          id: todayTopic?._id || `${currentChapterIndex}-${todayTopicIndex}`,
          title: todayTopic?.title || `Topic ${todayTopicIndex + 1}`,
          status:
            todayTopicIndex < currentTopicIndex
              ? "done"
              : todayTopicIndex === currentTopicIndex
                ? "current"
                : "upcoming",
        },
      ]
    : [];
  const todaysTaskDoneCount = todaysTaskItems.filter((task) => task.status === "done").length;
  const todaysTaskProgressPct =
    todaysTaskItems.length > 0 ? Math.round((todaysTaskDoneCount / todaysTaskItems.length) * 100) : 0;
  const expectedTopicCompletionInfo = useMemo(() => {
    const raw = studyProgress?.expectedTopicCompletionAt;
    if (!raw || studyProgress?.isCompleted) return { label: "", stale: false };
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return { label: "", stale: false };
    const stale = date.getTime() < Date.now();
    if (stale) return { label: "", stale: true };
    return {
      label: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stale: false,
    };
  }, [studyProgress]);
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
  const dailyAccuracySeries = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const points = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = getLocalDateKey(date);
      points.push({
        key,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        total: 0,
        attempts: 0,
      });
    }
    const byKey = new Map(points.map((item) => [item.key, item]));
    (assessmentStatuses || []).forEach((status) => {
      const updated = new Date(status?.updatedAt || status?.createdAt || "");
      if (Number.isNaN(updated.getTime())) return;
      const key = getLocalDateKey(updated);
      const point = byKey.get(key);
      if (!point) return;
      const total = Number(status?.totalQuestions || 10);
      const score = Number(status?.score || 0);
      if (total <= 0) return;
      point.total += total;
      point.attempts += Math.max(0, score);
    });
    return points.map((point) => {
      const accuracy = point.total > 0 ? Math.round((point.attempts / point.total) * 100) : 0;
      return { ...point, accuracy };
    });
  }, [assessmentStatuses]);
  const latestAccuracy = dailyAccuracySeries[dailyAccuracySeries.length - 1]?.accuracy || 0;
  const previousAccuracy = dailyAccuracySeries[dailyAccuracySeries.length - 2]?.accuracy || 0;
  const accuracyDelta = latestAccuracy - previousAccuracy;
  const accuracyChartPoints = useMemo(() => {
    if (!Array.isArray(dailyAccuracySeries) || dailyAccuracySeries.length === 0) return "";
    const width = 300;
    const height = 92;
    return dailyAccuracySeries
      .map((item, idx) => {
        const x = (idx / Math.max(1, dailyAccuracySeries.length - 1)) * width;
        const y = height - (Math.max(0, Math.min(100, item.accuracy)) / 100) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [dailyAccuracySeries]);
  const accuracyAreaPath = useMemo(() => {
    if (!Array.isArray(dailyAccuracySeries) || dailyAccuracySeries.length === 0) return "";
    const width = 300;
    const height = 92;
    const points = dailyAccuracySeries.map((item, idx) => {
      const x = (idx / Math.max(1, dailyAccuracySeries.length - 1)) * width;
      const y = height - (Math.max(0, Math.min(100, item.accuracy)) / 100) * height;
      return { x, y };
    });
    const line = points.map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" L ");
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x.toFixed(2)} 92 L ${line} L ${last.x.toFixed(2)} 92 Z`;
  }, [dailyAccuracySeries]);
  const averageAccuracy = useMemo(() => {
    if (!Array.isArray(dailyAccuracySeries) || dailyAccuracySeries.length === 0) return 0;
    return Math.round(
      dailyAccuracySeries.reduce((sum, point) => sum + Number(point.accuracy || 0), 0) / dailyAccuracySeries.length,
    );
  }, [dailyAccuracySeries]);
  const hoveredAccuracy =
    accuracyHoverIndex != null && dailyAccuracySeries[accuracyHoverIndex]
      ? dailyAccuracySeries[accuracyHoverIndex]
      : null;
  const hoverLeftPct =
    hoveredAccuracy && Array.isArray(dailyAccuracySeries) && dailyAccuracySeries.length > 1
      ? (accuracyHoverIndex / (dailyAccuracySeries.length - 1)) * 100
      : 0;
  const reviewChapterIndex = useMemo(() => {
    if (Array.isArray(assessmentStatuses) && assessmentStatuses.length > 0) {
      const sorted = [...assessmentStatuses].sort((a, b) => {
        const at = new Date(a?.updatedAt || 0).getTime();
        const bt = new Date(b?.updatedAt || 0).getTime();
        return bt - at;
      });
      const latest = sorted[0];
      if (Number.isFinite(Number(latest?.chapterIndex))) {
        return Number(latest.chapterIndex);
      }
    }
    return currentChapterIndex;
  }, [assessmentStatuses, currentChapterIndex]);
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
          <button className="mentor-logout-btn" type="button" onClick={disconnectAndLogout}>Logout</button>
        </div>
      </aside>
      <section className="interview-root">
        <div className={`main-content anagha-layout ${currentView === "chat" ? "" : "view-hidden"}`}>
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
          <div className="left-stack">
            <div className="video-card">
              <div className="video-inner">
                <div className="avatar-session-chip">
                  <div className="dot-pulse" />
                  <span className="avatar-session-title">{sessionTitle}</span>
                  <span className="avatar-session-live">Live</span>
                  <span className="session-timer">{sessionTimer}</span>
                </div>
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
              <div className="planner-note">
                {expectedTopicCompletionInfo.label
                  ? `Expected current-topic completion: ${expectedTopicCompletionInfo.label}`
                  : expectedTopicCompletionInfo.stale
                    ? "Start current topic to get a fresh completion ETA."
                    : ""}
              </div>
            </div>
            <div className="planner-accuracy-card">
              <div className="planner-accuracy-head">
                <div>
                  <p>Daily Assessment Accuracy</p>
                  <span>Last 7 days</span>
                </div>
                <div className="planner-accuracy-meta">
                  <strong>{latestAccuracy}%</strong>
                  <small className={accuracyDelta >= 0 ? "up" : "down"}>
                    {accuracyDelta >= 0 ? "+" : ""}{accuracyDelta}%
                  </small>
                </div>
              </div>
              <div className="planner-accuracy-chart">
                <svg viewBox="0 0 300 130" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Daily assessment accuracy">
                  <defs>
                    <linearGradient id="accuracyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#12b886" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#12b886" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {[20, 40, 60, 80].map((tick) => {
                    const y = 92 - (tick / 100) * 92;
                    return (
                      <g key={tick}>
                        <line x1="0" y1={y} x2="300" y2={y} className="accuracy-grid-line" />
                        <text x="2" y={y - 2} className="accuracy-y-label">{tick}%</text>
                      </g>
                    );
                  })}
                  {accuracyAreaPath ? <path d={accuracyAreaPath} className="accuracy-area" /> : null}
                  {averageAccuracy > 0 ? (
                    <line
                      x1="0"
                      y1={92 - (averageAccuracy / 100) * 92}
                      x2="300"
                      y2={92 - (averageAccuracy / 100) * 92}
                      className="accuracy-average-line"
                    />
                  ) : null}
                  <polyline points={accuracyChartPoints} className="accuracy-line" />
                  {dailyAccuracySeries.map((point, idx) => {
                    const x = (idx / Math.max(1, dailyAccuracySeries.length - 1)) * 300;
                    const y = 92 - (Math.max(0, Math.min(100, point.accuracy)) / 100) * 92;
                    const active = idx === accuracyHoverIndex;
                    return (
                      <g key={point.key}>
                        <circle
                          cx={x}
                          cy={y}
                          r={active ? "6.5" : "3.5"}
                          className={`accuracy-dot ${active ? "active" : ""}`}
                          style={{ "--dot-delay": `${idx * 80}ms` }}
                          onMouseEnter={() => setAccuracyHoverIndex(idx)}
                          onFocus={() => setAccuracyHoverIndex(idx)}
                          onMouseLeave={() => setAccuracyHoverIndex(null)}
                          onBlur={() => setAccuracyHoverIndex(null)}
                        />
                        <rect
                          x={Math.max(0, x - 10)}
                          y={0}
                          width="20"
                          height="110"
                          fill="transparent"
                          onMouseEnter={() => setAccuracyHoverIndex(idx)}
                          onMouseLeave={() => setAccuracyHoverIndex(null)}
                        />
                      </g>
                    );
                  })}
                  {dailyAccuracySeries.map((point, idx) => {
                    const x = (idx / Math.max(1, dailyAccuracySeries.length - 1)) * 300;
                    return (
                      <text key={`${point.key}-label`} x={x} y="123" textAnchor="middle" className="accuracy-day-label">
                        {point.label}
                      </text>
                    );
                  })}
                  {hoveredAccuracy ? (
                    <line
                      x1={(accuracyHoverIndex / Math.max(1, dailyAccuracySeries.length - 1)) * 300}
                      y1="0"
                      x2={(accuracyHoverIndex / Math.max(1, dailyAccuracySeries.length - 1)) * 300}
                      y2="102"
                      className="accuracy-hover-line"
                    />
                  ) : null}
                </svg>
                {hoveredAccuracy ? (
                  <div className="accuracy-tooltip" style={{ left: `${hoverLeftPct}%` }}>
                    <strong>{hoveredAccuracy.label}</strong>
                    <span>{hoveredAccuracy.accuracy}% accuracy</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="study-roadmap-sidebar">
            <div className="sidebar-header">
              <h3>Study Plan</h3>
              <span>{resolvedStudyMaterial?.subject}</span>
            </div>
            <div className="sidebar-content">
              {resolvedStudyMaterial?.chapters?.map((chapter, cIdx) => {
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
                  {weeklyStudyHours.map((entry, idx) => {
                    const maxSeconds = Math.max(1, ...weeklyStudyHours.map((item) => Number(item.seconds || 0)));
                    const heightPct = Math.max(8, Math.round((Number(entry.seconds || 0) / maxSeconds) * 100));
                    const hoursLabel = (Number(entry.seconds || 0) / 3600).toFixed(1);
                    return (
                      <div key={entry.key || entry.day} className="planner-weekly-bar-col">
                        <div className="planner-weekly-bar-wrap">
                          <div
                            className="planner-weekly-bar"
                            style={{ height: `${heightPct}%`, "--bar-delay": `${idx * 70}ms` }}
                            title={`${hoursLabel}h`}
                          />
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
                  <button type="button" onClick={() => onReviewChapterMistakes?.(reviewChapterIndex)}>
                    Review Mistakes
                  </button>
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
              {resolvedStudyMaterial?.chapters?.map((chapter, cIdx) => {
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
              {assessmentModal.type === "mistakes" ? (
                <>
                  <p className="assessment-instructions">
                    Score: {assessmentModal.score}/{assessmentModal.totalQuestions}
                  </p>
                  <div className="assessment-week-tabs">
                    {(resolvedStudyMaterial?.chapters || []).map((chapter, index) => (
                      <button
                        key={chapter?._id || index}
                        type="button"
                        className={`assessment-week-tab ${assessmentModal.chapterIndex === index ? "active" : ""}`}
                        onClick={() => onReviewChapterMistakes?.(index)}
                      >
                        <span>Week {index + 1}</span>
                        <small>{chapter?.chapterTitle || `Chapter ${index + 1}`}</small>
                      </button>
                    ))}
                  </div>
                  <div className="assessment-body">
                    {reviewLoading ? (
                      <div className="assessment-question">
                        <p>Loading week mistakes...</p>
                      </div>
                    ) : (assessmentModal.mistakes || []).length === 0 ? (
                      <div className="assessment-question">
                        <p>Great work. No mistakes found in your latest attempt for this chapter.</p>
                      </div>
                    ) : (
                      (assessmentModal.mistakes || []).map((item, index) => (
                        <div key={item.id || index} className="assessment-question">
                          <p>{index + 1}. {item.question}</p>
                          <p className="assessment-answer-wrong">
                            <strong>Your answer:</strong> {item.selectedOption || "Not answered"}
                          </p>
                          <p className="assessment-answer-correct">
                            <strong>Correct answer:</strong> {item.correctAnswer || "-"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="assessment-footer">
                    <button className="assessment-submit" type="button" onClick={onCloseAssessment}>
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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
        {reviewToast?.open ? (
          <div className="inline-review-toast" role="status" aria-live="polite">
            <div className="inline-review-toast-title">Review Update</div>
            <div className="inline-review-toast-message">{reviewToast.message}</div>
            <button type="button" onClick={onDismissReviewToast}>Dismiss</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
