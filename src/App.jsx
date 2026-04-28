import { useEffect, useMemo, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { LocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import { io } from "socket.io-client";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminLoginPage } from "./pages/AdminLoginPage.jsx";
import { AcademicInfoPage } from "./pages/AcademicInfoPage.jsx";
import { CandidateLoginPage } from "./pages/CandidateLoginPage.jsx";
import { CandidateSessionPage } from "./pages/CandidateSessionPage.jsx";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const SOCKET_CONFIG = (() => {
  try {
    const parsed = new URL(API_BASE_URL);
    return {
      url: parsed.origin,
      path: `${parsed.pathname.replace(/\/$/, "")}/socket.io`,
    };
  } catch {
    return {
      url: window.location.origin,
      path: "/socket.io",
    };
  }
})();
const TOKEN_STORAGE_KEY = "ai_mentor_token";
const ADMIN_TOKEN_STORAGE_KEY = "ai_mentor_admin_token";
const AVATAR_SESSION_CACHE_KEY = "ai_mentor_avatar_session_cache";
const WEEKLY_HOURS_STORAGE_KEY = "ai_mentor_weekly_hours_seconds";
const AVATAR_LOADER_STEPS = [
  "Connecting to AI Mentor",
  "Checking microphone",
  "Loading mentoring plan",
  "Preparing mentor guidance",
];
const AVATAR_LOADER_STATUS = [
  "Establishing secure connection...",
  "Microphone access granted...",
  "Loading your AI mentor session details...",
  "AI Mentor is ready!",
];
const AVATAR_SETUP_MAX_RETRIES = 1;

async function requestJsonWithFallback(path, options = {}) {
  const baseCandidates = [API_BASE_URL];

  let lastError = new Error("Request failed.");
  for (const base of baseCandidates) {
    const url = `${String(base).replace(/\/$/, "")}${path}`;
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload?.message ||
          (text.startsWith("<!DOCTYPE")
            ? `API returned HTML from ${url}. Check VITE_API_BASE_URL/backend route mapping.`
            : `Request failed (${response.status}).`);
        lastError = new Error(message);
        continue;
      }

      if (!payload) {
        lastError = new Error(
          `API returned non-JSON success response from ${url}. Check backend/proxy configuration.`,
        );
        continue;
      }

      return payload;
    } catch (error) {
      lastError = new Error(error?.message || `Network error calling ${url}`);
    }
  }
  throw lastError;
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("demo@aimentor.app");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerClass, setRegisterClass] = useState("");
  const [registerStream, setRegisterStream] = useState("JEE");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState({
    stream: "",
    class: "",
    marks: { physics: "", chemistry: "", maths: "", biology: "" },
    cgpa10: "",
    entranceExam: "JEE",
  });
  const [status, setStatus] = useState("offline");
  const [token, setToken] = useState("");
  const [socketError, setSocketError] = useState("");
  const [liveSttText, setLiveSttText] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [endingConversation, setEndingConversation] = useState(false);
  const [sessionEndedScreen, setSessionEndedScreen] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [avatarLoaderStep, setAvatarLoaderStep] = useState(0);
  const [avatarReady, setAvatarReady] = useState(false);
  const [assessmentModal, setAssessmentModal] = useState({ open: false, title: "", questions: [] });
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("checking");
  const [attendanceNote, setAttendanceNote] = useState("Verifying camera presence...");
  const [adminToken, setAdminToken] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRows, setAdminRows] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminTab, setAdminTab] = useState("dashboard");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteListFilter, setInviteListFilter] = useState("all");
  const [candidateListFilter, setCandidateListFilter] = useState("all");
  const [dashboardListFilter, setDashboardListFilter] = useState("all");
  const [candidateRows, setCandidateRows] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const [selectedCandidateEmail, setSelectedCandidateEmail] = useState("");
  const [studyProgress, setStudyProgress] = useState(null);
  const [assessmentStatuses, setAssessmentStatuses] = useState([]);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewToast, setReviewToast] = useState({ open: false, message: "" });
  const [reviewMistakesCache, setReviewMistakesCache] = useState({});

  const socketRef = useRef(null);
  const livekitRoomRef = useRef(null);
  const avatarContainerRef = useRef(null);
  const avatarBootstrappedRef = useRef(false);
  const localMicTrackRef = useRef(null);
  const camVideoRef = useRef(null);
  const camStreamRef = useRef(null);
  const transcriptBodyRef = useRef(null);
  const avatarVideoReadyRef = useRef(false);
  const avatarAudioElsRef = useRef([]);
  const pendingAvatarAudioElsRef = useRef([]);
  const pendingAvatarAudioTracksRef = useRef([]);
  const avatarReconnectTimerRef = useRef(null);
  const avatarReconnectAttemptsRef = useRef(0);
  const lastMergedUserMessageAtRef = useRef(0);
  const seenTranscriptIdsRef = useRef(new Set());
  const seenChatIdsRef = useRef(new Set());
  const spacePressedRef = useRef(false);
  const aiSmoothStateRef = useRef(new Map());
  const detectorModelRef = useRef(null);
  const detectorIntervalRef = useRef(null);
  const absentSinceRef = useRef(null);
  const cameraVideoTrackRef = useRef(null);
  const completionReportedRef = useRef(false);
  const completionEligibleRef = useRef(false);
  const pendingAutoEndRef = useRef(false);
  const studyProgressRef = useRef(null);
  const aiSilencedRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const avatarSetupRunIdRef = useRef(0);

  const isLoggedIn = Boolean(token);
  const isProfileComplete = useMemo(() => onboardingCompleted === true, [onboardingCompleted]);
  const isAdminPath = useMemo(() => {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.startsWith("/admin") || path.startsWith("/react/admin");
  }, []);
  const isAdminLoggedIn = Boolean(adminToken);
  const visibleMessages = avatarReady ? messages : [];
  const userMessageCount = useMemo(
    () => visibleMessages.filter((message) => message.role === "user").length,
    [visibleMessages],
  );
  const sessionTimer = useMemo(() => {
    const mm = String(Math.floor(sessionSeconds / 60)).padStart(2, "0");
    const ss = String(sessionSeconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [sessionSeconds]);
  const weeklyStudyHours = useMemo(() => {
    const today = new Date();
    const dayIndex = today.getDay();
    const diffToMonday = (dayIndex + 6) % 7;
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() - diffToMonday);

    let stored = {};
    try {
      stored = JSON.parse(window.localStorage.getItem(WEEKLY_HOURS_STORAGE_KEY) || "{}") || {};
    } catch {
      stored = {};
    }

    const points = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      const valueSeconds = Number(stored[key] || 0);
      points.push({
        key,
        day: date.toLocaleString("en-US", { weekday: "short" }),
        seconds: valueSeconds,
      });
    }
    const todayKey = today.toISOString().slice(0, 10);
    const todayPoint = points.find((point) => point.key === todayKey);
    if (todayPoint) {
      todayPoint.seconds = Math.max(todayPoint.seconds, sessionSeconds);
    }
    return points;
  }, [sessionSeconds]);

  useEffect(() => {
    if (isAdminPath || !isLoggedIn) return;
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const raw = window.localStorage.getItem(WEEKLY_HOURS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const currentSeconds = Number(parsed?.[todayKey] || 0);
      if (sessionSeconds > currentSeconds) {
        parsed[todayKey] = sessionSeconds;
        window.localStorage.setItem(WEEKLY_HOURS_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // Best-effort local tracking only.
    }
  }, [isAdminPath, isLoggedIn, sessionSeconds]);
  const adminStats = useMemo(() => {
    const total = adminRows.length;
    const detected = adminRows.filter((row) => row?.insights?.currentlyDetected).length;
    const notDetected = Math.max(0, total - detected);
    const totalPresent = adminRows.reduce(
      (sum, row) => sum + Number(row?.insights?.presentMinutes || 0),
      0,
    );
    return { total, detected, notDetected, totalPresent };
  }, [adminRows]);
  const candidateTotals = useMemo(() => {
    const invited = candidateRows.length;
    const attended = candidateRows.filter((row) => row?.attended).length;
    const pending = Math.max(0, invited - attended);
    return { invited, attended, pending };
  }, [candidateRows]);
  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateEmail) return null;
    return candidateRows.find((row) => row.email === selectedCandidateEmail) || null;
  }, [candidateRows, selectedCandidateEmail]);

  const loadCandidateProfile = async (jwtToken) => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const payload = await requestJsonWithFallback("/data/profile", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const profile = payload?.data || {};
      setCandidateProfile({
        stream: profile.stream || "",
        class: profile.class != null ? String(profile.class) : "",
        marks: {
          physics: profile?.marks?.physics != null ? String(profile.marks.physics) : "",
          chemistry: profile?.marks?.chemistry != null ? String(profile.marks.chemistry) : "",
          maths: profile?.marks?.maths != null ? String(profile.marks.maths) : "",
          biology: profile?.marks?.biology != null ? String(profile.marks.biology) : "",
        },
        cgpa10: profile.cgpa10 != null ? String(profile.cgpa10) : "",
        entranceExam: profile.entranceExam || "JEE",
      });
      setOnboardingCompleted(Boolean(profile.onboardingCompleted));
      
      if (profile.onboardingCompleted) {
        try {
          const studyPayload = await requestJsonWithFallback("/data/study-progress", {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          setStudyProgress(studyPayload?.data || null);
        } catch {
          // Study content not mandatory for login
        }
      }

      return profile;
    } catch (error) {
      setProfileError(error.message || "Failed to load profile.");
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const loadAssessmentStatuses = async (jwtToken) => {
    try {
      const payload = await requestJsonWithFallback("/data/study/assessment-statuses", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setAssessmentStatuses(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      // Not critical if fails
    }
  };

  const handleTakeChapterAssessment = async (chapterIndex) => {
    if (!token) return;
    setAssessmentSubmitted(false);
    setAssessmentAnswers({});
    setAssessmentLoading(true);
    try {
      const payload = await requestJsonWithFallback(`/data/study/chapters/${chapterIndex}/assessment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (payload?.success) {
        setAssessmentModal({
          open: true,
          title: payload.title,
          questions: payload.questions,
          chapterIndex,
          type: "chapter",
        });
      }
    } catch (error) {
      alert(error.message || "Failed to load assessment.");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleReviewChapterMistakes = async (chapterIndex) => {
    if (!token) return;
    const chapterTitle = String(
      studyProgressRef.current?.studyMaterialId?.chapters?.[chapterIndex]?.chapterTitle || "",
    ).trim();
    const modalTitle = chapterTitle
      ? `Review Mistakes (Week ${chapterIndex + 1}: ${chapterTitle})`
      : `Review Mistakes (Week ${chapterIndex + 1})`;

    // Keep modal stable and switch selected tab immediately.
    setAssessmentModal((prev) => ({
      ...prev,
      open: true,
      type: "mistakes",
      chapterIndex,
      title: modalTitle,
    }));

    const cached = reviewMistakesCache?.[chapterIndex];
    if (cached) {
      setAssessmentModal((prev) => ({
        ...prev,
        open: true,
        type: "mistakes",
        chapterIndex,
        title: modalTitle,
        score: cached.score,
        totalQuestions: cached.totalQuestions,
        mistakes: Array.isArray(cached.mistakes) ? cached.mistakes : [],
      }));
      return;
    }

    setReviewLoading(true);
    try {
      const payload = await requestJsonWithFallback(`/data/study/chapters/${chapterIndex}/mistakes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = payload?.data;
      if (!data) return;
      setReviewMistakesCache((prev) => ({
        ...prev,
        [chapterIndex]: {
          score: data.score,
          totalQuestions: data.totalQuestions,
          mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
        },
      }));
      setAssessmentModal({
        open: true,
        type: "mistakes",
        chapterIndex,
        title: modalTitle,
        score: data.score,
        totalQuestions: data.totalQuestions,
        mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
      });
    } catch (error) {
      setReviewToast({
        open: true,
        message: error.message || "Failed to load mistakes.",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!reviewToast.open) return undefined;
    const timer = window.setTimeout(() => {
      setReviewToast({ open: false, message: "" });
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [reviewToast]);

  useEffect(() => {
    if (isAdminPath) {
      const storedAdminToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (storedAdminToken) {
        setAdminToken(storedAdminToken);
      }
      return;
    }
    const storedCandidateToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedCandidateToken) return;
    setToken(storedCandidateToken);
    void (async () => {
      const profile = await loadCandidateProfile(storedCandidateToken);
      const complete = Boolean(profile?.onboardingCompleted);
      if (complete) {
        loadAssessmentStatuses(storedCandidateToken);
        setStatus("connecting");
        connectSocket(storedCandidateToken);
      } else {
        setStatus("offline");
      }
    })();
  }, [isAdminPath]);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (livekitRoomRef.current) livekitRoomRef.current.disconnect();
      if (camStreamRef.current) {
        camStreamRef.current.getTracks().forEach((track) => track.stop());
        camStreamRef.current = null;
      }
      avatarBootstrappedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isAdminPath || !isLoggedIn) return;
    const intervalId = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isAdminPath, isLoggedIn]);

  useEffect(() => {
    if (!camOn) return;
    const videoEl = camVideoRef.current;
    const stream = camStreamRef.current;
    if (!videoEl || !stream) return;
    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    void videoEl.play().catch(() => {});
  }, [camOn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const onKeyDown = (event) => {
      if (event.code !== "Space" || event.repeat || spacePressedRef.current) return;
      const tagName = event.target?.tagName?.toLowerCase?.() || "";
      if (tagName === "input" || tagName === "textarea") return;
      event.preventDefault();
      spacePressedRef.current = true;
      void beginHoldToTalk();
    };

    const onKeyUp = (event) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      if (!spacePressedRef.current) return;
      spacePressedRef.current = false;
      void endHoldToTalk();
    };

    const onBlur = () => {
      if (!spacePressedRef.current) return;
      spacePressedRef.current = false;
      void endHoldToTalk();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [isLoggedIn]);

  const appendMessage = (message) => setMessages((prev) => [...prev, message]);
  const upsertMessage = (nextMessage) => {
    setMessages((prev) => {
      const index = prev.findIndex((message) => message.id === nextMessage.id);
      if (index === -1) return [...prev, nextMessage];
      const updated = [...prev];
      updated[index] = { ...updated[index], ...nextMessage };
      return updated;
    });
  };
  const mergeOrAppendUserMessage = (text, timestamp) => {
    const safeText = String(text || "").trim();
    if (!safeText) return;
    const ts = Number(timestamp || Date.now());
    setMessages((prev) => {
      if (prev.length === 0) {
        lastMergedUserMessageAtRef.current = ts;
        return [...prev, { id: `user-merged-${ts}`, role: "user", text: safeText }];
      }
      const last = prev[prev.length - 1];
      const withinMergeWindow = ts - lastMergedUserMessageAtRef.current <= 7000;
      if (last?.role === "user" && withinMergeWindow) {
        const needsSpace = last.text && !/[.\n ]$/.test(last.text);
        const mergedText = `${last.text || ""}${needsSpace ? " " : ""}${safeText}`.trim();
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: mergedText };
        lastMergedUserMessageAtRef.current = ts;
        return updated;
      }
      lastMergedUserMessageAtRef.current = ts;
      return [...prev, { id: `user-merged-${ts}`, role: "user", text: safeText }];
    });
  };
  const clearAiSmoothers = () => {
    for (const state of aiSmoothStateRef.current.values()) {
      if (state.intervalId) clearInterval(state.intervalId);
    }
    aiSmoothStateRef.current.clear();
  };
  const tryPlayAvatarAudio = () => {
    const allAudioEls = [...avatarAudioElsRef.current, ...pendingAvatarAudioElsRef.current];
    if (allAudioEls.length === 0) return;
    for (const audioEl of allAudioEls) {
      try {
        const canPlay = audioUnlockedRef.current && !aiSilencedRef.current;
        audioEl.muted = !canPlay;
        if (!canPlay) {
          audioEl.pause();
          continue;
        }
        void audioEl.play().catch(() => {});
      } catch {
        // no-op
      }
    }
  };
  const attachAvatarAudioTrack = (track) => {
    if (!track || track.kind !== "audio") return;
    const el = document.createElement("audio");
    el.autoplay = false;
    el.playsInline = true;
    el.style.display = "none";
    el.muted = true;
    const mediaTrack = track?.mediaStreamTrack || null;
    if (mediaTrack) {
      el.srcObject = new MediaStream([mediaTrack]);
    } else {
      // Fallback for SDK shape differences.
      track.attach(el);
    }
    document.body.appendChild(el);
    avatarAudioElsRef.current.push(el);
    pendingAvatarAudioElsRef.current.push(el);
  };
  const flushPendingAvatarAudioTracks = () => {
    if (!audioUnlockedRef.current) return;
    const queued = pendingAvatarAudioTracksRef.current.splice(0, pendingAvatarAudioTracksRef.current.length);
    for (const track of queued) {
      attachAvatarAudioTrack(track);
    }
  };
  const unlockRoomAudio = async () => {
    const room = livekitRoomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
    } catch {
      // Browser may still block until a stronger user gesture; retry on next interaction.
    }
  };

  useEffect(() => {
    const unlockAudio = () => {
      audioUnlockedRef.current = true;
      flushPendingAvatarAudioTracks();
      void unlockRoomAudio();
      tryPlayAvatarAudio();
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);
  const reportTrainingCompletion = async () => {
    // Deprecated path: completion is now persisted by backend from attendance ping.
    completionReportedRef.current = true;
  };
  const smoothUpsertAiMessage = (id, targetText) => {
    const safeTarget = typeof targetText === "string" ? targetText : "";
    const stateMap = aiSmoothStateRef.current;
    let state = stateMap.get(id);
    if (!state) {
      state = { display: "", target: safeTarget, intervalId: null };
      stateMap.set(id, state);
    }

    state.target = safeTarget;
    if (state.display === state.target) {
      upsertMessage({ id, role: "ai", text: state.display });
      return;
    }
    if (state.intervalId) return;

    state.intervalId = setInterval(() => {
      const current = state.display;
      const nextTarget = state.target;

      if (current === nextTarget) {
        clearInterval(state.intervalId);
        state.intervalId = null;
        return;
      }

      // If upstream sends a non-prefix replacement, snap to target to avoid weird rewinds.
      if (!nextTarget.startsWith(current)) {
        state.display = nextTarget;
      } else {
        const remaining = nextTarget.length - current.length;
        const step = remaining > 30 ? 4 : remaining > 15 ? 3 : remaining > 6 ? 2 : 1;
        state.display = nextTarget.slice(0, current.length + step);
      }

      upsertMessage({ id, role: "ai", text: state.display });

      if (state.display === nextTarget) {
        clearInterval(state.intervalId);
        state.intervalId = null;
      }
    }, 180);
  };

  useEffect(() => {
    return () => {
      clearAiSmoothers();
    };
  }, []);

  useEffect(() => {
    studyProgressRef.current = studyProgress;
  }, [studyProgress]);

  useEffect(() => {
    const shouldSilence = Boolean(assessmentLoading || assessmentModal.open);
    aiSilencedRef.current = shouldSilence;
    const allAudioEls = [...avatarAudioElsRef.current, ...pendingAvatarAudioElsRef.current];
    for (const audioEl of allAudioEls) {
      try {
        const canPlay = audioUnlockedRef.current && !shouldSilence;
        audioEl.muted = !canPlay;
        if (!canPlay) audioEl.pause();
        else void audioEl.play().catch(() => {});
      } catch {
        // no-op
      }
    }
    if (shouldSilence) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify({ type: "client_interrupt", reason: "assessment" }));
        void livekitRoomRef.current?.localParticipant
          ?.publishData?.(payload, { reliable: true, topic: "mentor.client.interrupt" })
          .catch(() => {});
      } catch {
        // no-op
      }
    }
  }, [assessmentLoading, assessmentModal.open]);

  useEffect(() => {
    const stopDetector = () => {
      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }
      absentSinceRef.current = null;
    };

    if (!isLoggedIn || !camOn || !avatarReady) {
      stopDetector();
      if (!isLoggedIn) {
        setAttendanceStatus("checking");
        setAttendanceNote("Verifying camera presence...");
      } else if (!camOn && avatarReady) {
        setAttendanceStatus("away");
        setAttendanceNote("Camera appears off. Please enable camera.");
      }
      return;
    }

    let cancelled = false;

    const runDetection = async () => {
      const videoEl = camVideoRef.current;
      const cameraTrack =
        cameraVideoTrackRef.current || camStreamRef.current?.getVideoTracks?.()[0] || null;
      const hasLiveTrack = Boolean(
        cameraTrack &&
          cameraTrack.readyState === "live" &&
          cameraTrack.enabled &&
          !cameraTrack.muted,
      );
      if (!hasLiveTrack) {
        absentSinceRef.current = null;
        if (!cancelled) {
          setAttendanceStatus("away");
          setAttendanceNote("Camera appears off. Please enable camera.");
        }
        return;
      }
      if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
        if (!cancelled) {
          setAttendanceStatus("checking");
          setAttendanceNote("Waiting for camera frames...");
        }
        return;
      }

      try {
        if (!detectorModelRef.current) {
          detectorModelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        }
        const predictions = await detectorModelRef.current.detect(videoEl, 6);
        const hasPerson = predictions.some(
          (prediction) => prediction.class === "person" && prediction.score >= 0.55,
        );
        if (hasPerson) {
          absentSinceRef.current = null;
          if (!cancelled) {
            setAttendanceStatus("present");
            setAttendanceNote("Candidate detected on camera.");
          }
          return;
        }

        if (!absentSinceRef.current) {
          absentSinceRef.current = Date.now();
        }
        const awaySeconds = Math.floor((Date.now() - absentSinceRef.current) / 1000);
        if (!cancelled) {
          if (awaySeconds >= 10) {
            setAttendanceStatus("away");
            setAttendanceNote("No person detected for 10s. Please stay in frame.");
          } else {
            setAttendanceStatus("checking");
            setAttendanceNote("No person detected. Waiting...");
          }
        }
      } catch {
        if (!cancelled) {
          setAttendanceStatus("error");
          setAttendanceNote("Object detection unavailable on this device.");
        }
      }
    };

    void runDetection();
    detectorIntervalRef.current = setInterval(() => {
      void runDetection();
    }, 2000);

    return () => {
      cancelled = true;
      stopDetector();
    };
  }, [avatarReady, camOn, isLoggedIn]);

  useEffect(() => {
    const container = transcriptBodyRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, aiSpeaking]);

  useEffect(() => {
    if (!avatarLoading) {
      setAvatarLoaderStep(0);
      return;
    }
    setAvatarLoaderStep(0);
    const intervalId = setInterval(() => {
      setAvatarLoaderStep((prev) => Math.min(prev + 1, AVATAR_LOADER_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(intervalId);
  }, [avatarLoading]);

  useEffect(() => {
    if (isAdminPath || !token || !isLoggedIn || status === "offline") return;

    const sendAttendancePing = async () => {
      try {
        await fetch(`${API_BASE_URL}/attendance/camera`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: attendanceStatus,
            note: attendanceNote,
            cameraOn: camOn,
            avatarReady,
            personDetected: attendanceStatus === "present",
            roomName: null,
            clientTs: new Date().toISOString(),
          }),
        });
      } catch {
        // best-effort telemetry; do not block UX
      }
    };

    void sendAttendancePing();
    const intervalId = setInterval(() => {
      void sendAttendancePing();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [attendanceNote, attendanceStatus, avatarReady, camOn, isAdminPath, isLoggedIn, status, token]);

  useEffect(() => {
    if (!isAdminPath || !adminToken) return;

    const loadAttendance = async () => {
      setAdminLoading(true);
      setAdminError("");
      try {
        const response = await fetch(`${API_BASE_URL}/attendance/camera/latest?limit=100`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to fetch attendance.");
        }
        setAdminRows(Array.isArray(payload?.records) ? payload.records : []);
      } catch (error) {
        setAdminError(error.message || "Failed to fetch attendance.");
      } finally {
        setAdminLoading(false);
      }
    };

    void loadAttendance();
    const intervalId = setInterval(() => {
      void loadAttendance();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [adminToken, isAdminPath]);

  useEffect(() => {
    if (!isAdminPath || !adminToken) return;

    const loadCandidates = async () => {
      setCandidateLoading(true);
      setCandidateError("");
      try {
        const response = await fetch(`${API_BASE_URL}/admin/candidates/invited`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to fetch invited candidates.");
        }
        setCandidateRows(Array.isArray(payload?.records) ? payload.records : []);
        setSelectedCandidateEmail((prev) => {
          if (!prev) return "";
          return (payload?.records || []).some((row) => row?.email === prev) ? prev : "";
        });
      } catch (error) {
        setCandidateError(error.message || "Failed to fetch invited candidates.");
      } finally {
        setCandidateLoading(false);
      }
    };

    void loadCandidates();
    const intervalId = setInterval(() => {
      void loadCandidates();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [adminToken, isAdminPath]);

  const setupAvatarRoom = async (jwtToken) => {
    if (avatarBootstrappedRef.current) return;
    avatarBootstrappedRef.current = true;
    const runId = ++avatarSetupRunIdRef.current;
    const isStaleRun = () => runId !== avatarSetupRunIdRef.current;
    setAvatarReady(false);
    setAvatarLoading(true);
    try {
      let payload = null;
      try {
        const cachedRaw = window.localStorage.getItem(AVATAR_SESSION_CACHE_KEY);
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        if (cached?.payload && Number(cached?.expiresAt || 0) > Date.now()) {
          payload = cached.payload;
        }
      } catch {
        window.localStorage.removeItem(AVATAR_SESSION_CACHE_KEY);
      }

      if (!payload) {
        const response = await fetch(`${API_BASE_URL}/avatar/bey/session`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Failed to start avatar session.");
        }
        window.localStorage.setItem(
          AVATAR_SESSION_CACHE_KEY,
          JSON.stringify({
            payload,
            expiresAt: Date.now() + 90_000,
          }),
        );
      }
      if (isStaleRun()) {
        return;
      }

      if (livekitRoomRef.current) livekitRoomRef.current.disconnect();

      const room = new Room();
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "video" && avatarContainerRef.current) {
          avatarContainerRef.current.innerHTML = "";
          const el = track.attach();
          el.style.width = "100%";
          el.style.height = "100%";
          el.style.objectFit = "cover";
          el.style.borderRadius = "10px";
          avatarContainerRef.current.appendChild(el);
          avatarVideoReadyRef.current = true;
          setAvatarReady(true);
          for (const audioEl of pendingAvatarAudioElsRef.current) {
            void audioEl.play().catch(() => {});
          }
          pendingAvatarAudioElsRef.current = [];
          setAvatarLoading(false);
        }
        if (track.kind === "audio") {
          if (!audioUnlockedRef.current) {
            pendingAvatarAudioTracksRef.current.push(track);
          } else {
            attachAvatarAudioTrack(track);
          }
          if (audioUnlockedRef.current && avatarVideoReadyRef.current && !aiSilencedRef.current) {
            flushPendingAvatarAudioTracks();
            void unlockRoomAudio();
            tryPlayAvatarAudio();
          }
        }
      });
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const speakerIdentity = participant?.identity || "unknown";
        // User + agent text comes immediately via worker data channel (mentor.user.transcript / mentor.ai.transcript).
        // Room transcription is often delayed (synced to playout); skip here to avoid "nothing until AI finishes".
        if (
          speakerIdentity.startsWith("user-") ||
          speakerIdentity.includes("bey") ||
          speakerIdentity.startsWith("agent-")
        ) {
          return;
        }
        for (const segment of segments || []) {
          const text = (segment?.text || "").trim();
          if (!text || !segment?.id) continue;
          const safeIdentity = speakerIdentity.replace(/[^a-zA-Z0-9_-]/g, "_");
          upsertMessage({
            id: `stt-${safeIdentity}-${segment.id}`,
            role: "system",
            text,
          });
          if (segment.final) {
            seenTranscriptIdsRef.current.add(segment.id);
          }
        }
      });
      room.on(RoomEvent.ChatMessage, (message, participant) => {
        if (!message?.id || seenChatIdsRef.current.has(message.id)) return;
        seenChatIdsRef.current.add(message.id);
        appendMessage({
          id: `chat-${message.id}`,
          role: participant?.identity?.includes("bey") ? "ai" : "system",
          text: message.message || "",
        });
      });
      room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
        try {
          const raw = new TextDecoder().decode(payload);
          const parsed = JSON.parse(raw);

          if (topic === "mentor.user.transcript") {
            if (parsed?.type !== "user_transcript" || !parsed?.id) return;
            if (parsed?.final) {
              mergeOrAppendUserMessage(parsed.text || "", parsed.timestamp);
            } else {
              upsertMessage({
                id: `user-data-${parsed.id}`,
                role: "user",
                text: parsed.text || "",
              });
            }
            return;
          }

          if (topic === "mentor.training.status") {
            if (parsed?.type === "training_completion_reached") {
              completionEligibleRef.current = true;
              completionReportedRef.current = true;
              appendMessage({
                id: `sys-complete-${Date.now()}`,
                role: "system",
        text: "Mentoring completion checkpoint reached.",
              });
              if (pendingAutoEndRef.current) {
                void endConversation();
              }
              return;
            }
            if (parsed?.type === "training_end_requested") {
              if (endingConversation) return;
              void endConversation();
              return;
            }
            return;
          }

          if (topic === "mentor.assessment") {
            if (parsed?.type !== "assessment_start") return;
            const chapterIndex = Number(studyProgressRef.current?.currentChapterIndex ?? 0);
            appendMessage({
              id: `sys-assessment-${Date.now()}`,
              role: "system",
              text: "Assessment requested. Generating chapter questions...",
            });
            setAssessmentSubmitted(false);
            setAssessmentAnswers({});
            setAssessmentLoading(true);
            void (async () => {
              try {
                const apiPayload = await requestJsonWithFallback(
                  `/data/study/chapters/${chapterIndex}/assessment`,
                  { headers: { Authorization: `Bearer ${jwtToken}` } },
                );
                if (apiPayload?.success) {
                  setAssessmentModal({
                    open: true,
                    title: apiPayload.title,
                    questions: apiPayload.questions,
                    chapterIndex,
                    type: "chapter",
                  });
                }
              } catch (error) {
                setSocketError(error.message || "Failed to load chapter assessment.");
              } finally {
                setAssessmentLoading(false);
              }
            })();
            return;
          }

          if (topic !== "mentor.ai.transcript") return;
          if (parsed?.type !== "assistant_transcript" || !parsed?.id) return;
          const displayText =
            parsed.interrupted && parsed.text
              ? `${parsed.text} (interrupted)`
              : parsed.interrupted
                ? "(interrupted)"
                : parsed.text || "";
          smoothUpsertAiMessage(`ai-data-${parsed.id}`, displayText);
          if (parsed?.isLastQuestion === true && !parsed?.interrupted) {
            completionEligibleRef.current = true;
            if (pendingAutoEndRef.current) {
              void endConversation();
            }
          }
        } catch {
          // Ignore malformed payloads from unrelated data topics.
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        avatarBootstrappedRef.current = false;
        avatarVideoReadyRef.current = false;
        setAvatarReady(false);
        setAvatarLoading(false);
        for (const audioEl of avatarAudioElsRef.current) {
          audioEl.remove();
        }
        avatarAudioElsRef.current = [];
        for (const audioEl of pendingAvatarAudioElsRef.current) {
          audioEl.remove();
        }
        pendingAvatarAudioElsRef.current = [];
        pendingAvatarAudioTracksRef.current = [];
        if (avatarContainerRef.current) avatarContainerRef.current.innerHTML = "";
        setAiSpeaking(false);

        const shouldAutoRecover = !endingConversation && Boolean(socketRef.current?.connected);
        if (!shouldAutoRecover) return;

        const nextAttempt = avatarReconnectAttemptsRef.current + 1;
        avatarReconnectAttemptsRef.current = nextAttempt;
        if (nextAttempt > 1) {
          setSocketError("Session disconnected repeatedly. Please logout and login again.");
          return;
        }

        setSocketError("Session disconnected. Reconnecting...");
        if (avatarReconnectTimerRef.current) {
          clearTimeout(avatarReconnectTimerRef.current);
        }
        avatarReconnectTimerRef.current = setTimeout(() => {
          void setupAvatarRoomWithRetry(jwtToken);
        }, 500 * nextAttempt);
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const speaking = (speakers || []).some((participant) => {
          const identity = participant?.identity || "";
          return identity.includes("bey") || identity.startsWith("agent-");
        });
        setAiSpeaking(speaking);
      });

      await room.connect(payload.livekitUrl, payload.participantToken);
      if (isStaleRun()) {
        room.disconnect();
        return;
      }
      livekitRoomRef.current = room;
      avatarReconnectAttemptsRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (isStaleRun()) {
        stream.getTracks().forEach((track) => track.stop());
        room.disconnect();
        return;
      }
      const micSource = stream.getAudioTracks()[0];
      const micTrack = new LocalAudioTrack(micSource);
      await micTrack.mute();
      await room.localParticipant.publishTrack(micTrack, { source: Track.Source.Microphone });
      if (isStaleRun()) {
        try {
          await micTrack.mute();
        } catch {
          // no-op
        }
        micTrack.stop();
        room.disconnect();
        return;
      }
      localMicTrackRef.current = micTrack;
      try {
        if (camStreamRef.current) {
          camStreamRef.current.getTracks().forEach((track) => track.stop());
          camStreamRef.current = null;
        }
        if (cameraVideoTrackRef.current) {
          cameraVideoTrackRef.current.onended = null;
          cameraVideoTrackRef.current.onmute = null;
          cameraVideoTrackRef.current.onunmute = null;
          cameraVideoTrackRef.current = null;
        }
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (isStaleRun()) {
          camStream.getTracks().forEach((track) => track.stop());
          return;
        }
        camStreamRef.current = camStream;
        const camTrack = camStream.getVideoTracks()[0] || null;
        cameraVideoTrackRef.current = camTrack;
        if (camTrack) {
          camTrack.onended = () => setCamOn(false);
          camTrack.onmute = () => setCamOn(false);
          camTrack.onunmute = () => setCamOn(true);
        }
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = camStream;
          void camVideoRef.current.play().catch(() => {});
        }
        setCamOn(true);
      } catch {
        setCamOn(false);
      }
    } catch (error) {
      window.localStorage.removeItem(AVATAR_SESSION_CACHE_KEY);
      setSocketError(error.message || "Avatar setup failed.");
      setAvatarLoading(false);
      avatarBootstrappedRef.current = false;
      throw error;
    }
  };

  const setupAvatarRoomWithRetry = async (jwtToken) => {
    const existingRoom = livekitRoomRef.current;
    const existingState = String(existingRoom?.state || "").toLowerCase();
    if (existingRoom && (existingState === "connected" || existingState === "reconnecting")) {
      return;
    }

    let lastError = null;
    for (let attempt = 1; attempt <= AVATAR_SETUP_MAX_RETRIES; attempt += 1) {
      try {
        await setupAvatarRoom(jwtToken);
        return;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
    if (lastError) {
      setSocketError(lastError.message || "Avatar setup failed.");
    }
  };

  const connectSocket = (jwtToken) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const socket = io(SOCKET_CONFIG.url, {
      transports: ["websocket"],
      path: SOCKET_CONFIG.path,
      auth: { token: jwtToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      setStatus("connected");
      setSocketError("");
      void setupAvatarRoomWithRetry(jwtToken);
    });

    socket.on("connect_error", (error) => {
      setStatus("error");
      setSocketError(error.message || "Socket connection failed.");
      if ((error.message || "").toLowerCase().includes("auth")) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(AVATAR_SESSION_CACHE_KEY);
        setToken("");
      }
    });

    socket.on("session_ready", () => {
      appendMessage({
        id: `sys-${Date.now()}`,
        role: "system",
        text: "Realtime mentor session ready. Hold to talk.",
      });
    });

    socket.on("conversation_history", ({ messages: historyMessages }) => {
      if (!Array.isArray(historyMessages)) return;
      const hydrated = historyMessages
        .filter((message) => message && typeof message.text === "string" && message.text.trim())
        .map((message, index) => ({
          id: `history-${message.id || index}`,
          role: message.role === "assistant" ? "ai" : message.role === "user" ? "user" : "system",
          text: String(message.text || "").trim(),
        }));
      if (hydrated.length === 0) return;
      setMessages(hydrated);
    });

    socket.on("disconnect", (reason) => {
      setStatus("offline");
      if (reason !== "io client disconnect") {
        setSocketError("Connection lost. Reconnecting...");
      }
    });

    socketRef.current = socket;
  };

  const sendTextMessage = async () => {
    const text = String(chatInput || "").trim();
    if (!text) return;
    appendMessage({
      id: `user-text-${Date.now()}`,
      role: "user",
      text,
    });
    setChatInput("");
    try {
      if (livekitRoomRef.current?.localParticipant?.sendText) {
        await livekitRoomRef.current.localParticipant.sendText(text, { topic: "lk.chat" });
      }
    } catch {
      setSocketError("Could not send text message.");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setSocketError("");
    try {
      const payload = await requestJsonWithFallback("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const nextToken = payload?.data?.token || payload?.token || "";
      setToken(nextToken);
      setSessionEndedScreen(false);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      const profile = await loadCandidateProfile(nextToken);
      const complete = Boolean(profile?.onboardingCompleted);
      if (complete) {
        setStatus("connecting");
        connectSocket(nextToken);
      } else {
        setStatus("offline");
      }
    } catch (error) {
      setStatus("error");
      setSocketError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setSocketError("");
    try {
      await requestJsonWithFallback("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: registerFirstName,
          lastName: registerLastName,
          email: registerEmail,
          phonenumber: registerPhone,
          stream: registerStream,
          class: Number(registerClass),
          password: registerPassword,
        }),
      });
      setAuthMode("login");
      setLoginEmail(registerEmail);
      setLoginPassword("");
      setRegisterFirstName("");
      setRegisterLastName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterClass("");
      setRegisterStream("JEE");
      setRegisterPassword("");
      setSocketError("Registration successful. Please sign in.");
    } catch (error) {
      setSocketError(error.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setCandidateProfile((prev) => {
      if (field.startsWith("marks.")) {
        const subject = field.split(".")[1];
        return {
          ...prev,
          marks: {
            ...prev.marks,
            [subject]: String(value).replace(/[^\d]/g, "").slice(0, 3),
          },
        };
      }
      if (field === "class") {
        return { ...prev, class: String(value).replace(/[^\d]/g, "").slice(0, 2) };
      }
      if (field === "cgpa10") {
        return { ...prev, cgpa10: String(value).replace(/[^0-9.]/g, "").slice(0, 4) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!token) return;
    setProfileSaveLoading(true);
    setProfileError("");
    try {
      const payload = await requestJsonWithFallback("/data/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stream: candidateProfile.stream,
          class: Number(candidateProfile.class),
          marks: {
            physics: candidateProfile.marks.physics === "" ? null : Number(candidateProfile.marks.physics),
            chemistry: candidateProfile.marks.chemistry === "" ? null : Number(candidateProfile.marks.chemistry),
            maths: candidateProfile.marks.maths === "" ? null : Number(candidateProfile.marks.maths),
            biology: candidateProfile.marks.biology === "" ? null : Number(candidateProfile.marks.biology),
          },
          cgpa10: candidateProfile.cgpa10 === "" ? null : Number(candidateProfile.cgpa10),
          entranceExam: candidateProfile.entranceExam,
        }),
      });
      const saved = payload?.data || {};
      setCandidateProfile({
        stream: saved.stream || candidateProfile.stream,
        class: saved.class != null ? String(saved.class) : candidateProfile.class,
        marks: {
          physics: saved?.marks?.physics != null ? String(saved.marks.physics) : candidateProfile.marks.physics,
          chemistry:
            saved?.marks?.chemistry != null ? String(saved.marks.chemistry) : candidateProfile.marks.chemistry,
          maths: saved?.marks?.maths != null ? String(saved.marks.maths) : candidateProfile.marks.maths,
          biology: saved?.marks?.biology != null ? String(saved.marks.biology) : candidateProfile.marks.biology,
        },
        cgpa10: saved.cgpa10 != null ? String(saved.cgpa10) : candidateProfile.cgpa10,
        entranceExam: saved.entranceExam || candidateProfile.entranceExam,
      });
      setOnboardingCompleted(true);
      setStatus("connecting");
      connectSocket(token);
    } catch (error) {
      setProfileError(error.message || "Failed to save profile.");
    } finally {
      setProfileSaveLoading(false);
    }
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Admin login failed.");
      }
      setAdminToken(payload.token);
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, payload.token);
      setAdminPassword("");
    } catch (error) {
      setAdminError(error.message || "Admin login failed.");
    }
  };

  const handleSendInvite = async (event) => {
    event.preventDefault();
    setInviteMessage("");
    setInviteError("");
    if (!inviteName.trim()) {
      setInviteError("Enter candidate name.");
      return;
    }
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Enter a valid candidate email.");
      return;
    }
    setInviteSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to send invitation.");
      }
      setInviteMessage(payload?.message || "Invitation sent.");
      setInviteName("");
      setInviteEmail("");
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/admin/candidates/invited`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const refreshPayload = await refreshResponse.json();
        if (refreshResponse.ok) {
          const refreshedRows = Array.isArray(refreshPayload?.records) ? refreshPayload.records : [];
          setCandidateRows(refreshedRows);
          setSelectedCandidateEmail((prev) => {
            if (!prev) return "";
            return refreshedRows.some((row) => row?.email === prev) ? prev : "";
          });
        }
      } catch {
        // no-op
      }
    } catch (error) {
      setInviteError(error.message || "Failed to send invitation.");
    } finally {
      setInviteSending(false);
    }
  };
  const handleBulkReminder = async (rows) => {
    const targets = Array.isArray(rows) ? rows : [];
    if (targets.length === 0) return { message: "No candidates selected." };
    let success = 0;
    for (const row of targets) {
      const name = String(row?.candidateName || row?.email || "").trim();
      const email = String(row?.email || "")
        .trim()
        .toLowerCase();
      if (!name || !email) continue;
      const response = await fetch(`${API_BASE_URL}/admin/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name, email }),
      });
      if (response.ok) success += 1;
    }
    const refreshed = await fetch(`${API_BASE_URL}/admin/candidates/invited`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const payload = await refreshed.json();
    if (refreshed.ok) {
      setCandidateRows(Array.isArray(payload?.records) ? payload.records : []);
    }
    return { message: `Reminder sent to ${success}/${targets.length} candidates.` };
  };

  const interruptAi = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("interrupt");
  };

  const disconnectRealtime = () => {
    avatarSetupRunIdRef.current += 1;
    if (avatarReconnectTimerRef.current) {
      clearTimeout(avatarReconnectTimerRef.current);
      avatarReconnectTimerRef.current = null;
    }
    avatarReconnectAttemptsRef.current = 0;
    lastMergedUserMessageAtRef.current = 0;
    try {
      void localMicTrackRef.current?.mute?.();
      localMicTrackRef.current?.stop?.();
    } catch {
      // no-op
    }
    localMicTrackRef.current = null;
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((track) => track.stop());
      camStreamRef.current = null;
    }
    if (cameraVideoTrackRef.current) {
      cameraVideoTrackRef.current.onended = null;
      cameraVideoTrackRef.current.onmute = null;
      cameraVideoTrackRef.current.onunmute = null;
      cameraVideoTrackRef.current = null;
    }
    if (camVideoRef.current) {
      camVideoRef.current.srcObject = null;
    }
    setCamOn(false);

    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
      livekitRoomRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    avatarBootstrappedRef.current = false;
    avatarVideoReadyRef.current = false;
    setAvatarReady(false);
    for (const audioEl of avatarAudioElsRef.current) {
      audioEl.remove();
    }
    avatarAudioElsRef.current = [];
    for (const audioEl of pendingAvatarAudioElsRef.current) {
      audioEl.remove();
    }
    pendingAvatarAudioElsRef.current = [];
    pendingAvatarAudioTracksRef.current = [];
    if (avatarContainerRef.current) avatarContainerRef.current.innerHTML = "";
    clearAiSmoothers();
    setLiveSttText("");
    setStatus("offline");
    setSessionSeconds(0);
    setAiSpeaking(false);
    setAttendanceStatus("checking");
    setAttendanceNote("Verifying camera presence...");
    completionReportedRef.current = false;
    completionEligibleRef.current = false;
    pendingAutoEndRef.current = false;
    setAssessmentModal({ open: false, title: "", questions: [] });
    setAssessmentAnswers({});
    setAssessmentSubmitted(false);
  };

  const resetCandidateStateAfterLogout = () => {
    setSessionEndedScreen(false);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AVATAR_SESSION_CACHE_KEY);
    setToken("");
    setCandidateProfile({
      stream: "",
      class: "",
      marks: { physics: "", chemistry: "", maths: "", biology: "" },
      cgpa10: "",
      entranceExam: "JEE",
    });
    setOnboardingCompleted(false);
    setMessages([]);
    setStudyProgress(null);
    setProfileError("");
    setSocketError("");
  };

  const logoutCandidate = async () => {
    const jwtToken = token || window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
    if (jwtToken) {
      try {
        await fetch(`${API_BASE_URL}/avatar/bey/end`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
      } catch {
        // Best-effort cleanup of LiveKit/Bey resources.
      }
    }
    disconnectRealtime();
    resetCandidateStateAfterLogout();
  };

  const endConversation = async () => {
    if (!token || endingConversation) return;
    setEndingConversation(true);
    setSocketError("");
    try {
      await fetch(`${API_BASE_URL}/avatar/bey/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      disconnectRealtime();
      setSessionEndedScreen(true);
      appendMessage({
        id: `sys-end-${Date.now()}`,
        role: "system",
        text: "Conversation ended. Start again by logging in.",
      });
    } catch (error) {
      setSocketError(error.message || "Failed to end conversation.");
    } finally {
      setEndingConversation(false);
    }
  };

  const beginHoldToTalk = async () => {
    audioUnlockedRef.current = true;
    await unlockRoomAudio();
    tryPlayAvatarAudio();
    setStatus("listening");
    setLiveSttText("Talking...");
    try {
      await localMicTrackRef.current?.unmute();
    } catch {
      setSocketError("Could not unmute microphone track.");
      setStatus("error");
    }
  };

  const endHoldToTalk = async () => {
    try {
      await localMicTrackRef.current?.mute();
      setLiveSttText("");
      setStatus("connected");
    } catch {
      setSocketError("Could not mute microphone track.");
    }
  };

  const handleTalkPointerDown = async (event) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore capture errors on unsupported environments.
    }
    await beginHoldToTalk();
  };

  const handleTalkPointerUp = async (event) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release errors.
    }
    await endHoldToTalk();
  };

  if (!isLoggedIn && !isAdminPath) {
    return (
      <CandidateLoginPage
        authMode={authMode}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        registerFirstName={registerFirstName}
        registerLastName={registerLastName}
        registerEmail={registerEmail}
        registerPhone={registerPhone}
        registerClass={registerClass}
        registerStream={registerStream}
        registerPassword={registerPassword}
        socketError={socketError}
        authLoading={authLoading}
        onSwitchMode={(nextMode) => setAuthMode(nextMode)}
        onLoginEmailChange={(event) => setLoginEmail(event.target.value)}
        onLoginPasswordChange={(event) => setLoginPassword(event.target.value)}
        onRegisterFirstNameChange={(event) => setRegisterFirstName(event.target.value)}
        onRegisterLastNameChange={(event) => setRegisterLastName(event.target.value)}
        onRegisterEmailChange={(event) => setRegisterEmail(event.target.value)}
        onRegisterPhoneChange={(event) => setRegisterPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
        onRegisterClassChange={(event) => setRegisterClass(event.target.value)}
        onRegisterStreamChange={(event) => setRegisterStream(event.target.value)}
        onRegisterPasswordChange={(event) => setRegisterPassword(event.target.value)}
        onSubmitLogin={handleLogin}
        onSubmitRegister={handleRegister}
      />
    );
  }

  if (isAdminPath) {
    if (!isAdminLoggedIn) {
      return (
        <AdminLoginPage
          adminEmail={adminEmail}
          adminPassword={adminPassword}
          adminError={adminError}
          onAdminEmailChange={(event) => setAdminEmail(event.target.value)}
          onAdminPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleAdminLogin}
        />
      );
    }

    const todayLabel = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <AdminDashboardPage
        adminStats={adminStats}
        adminRows={adminRows}
        adminLoading={adminLoading}
        adminError={adminError}
        activeTab={adminTab}
        inviteName={inviteName}
        inviteEmail={inviteEmail}
        inviteSending={inviteSending}
        inviteMessage={inviteMessage}
        inviteError={inviteError}
        inviteListFilter={inviteListFilter}
        candidateListFilter={candidateListFilter}
        dashboardListFilter={dashboardListFilter}
        candidateRows={candidateRows}
        candidateTotals={candidateTotals}
        candidateLoading={candidateLoading}
        candidateError={candidateError}
        selectedCandidate={selectedCandidate}
        todayLabel={todayLabel}
        onLogout={() => {
          window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          setAdminToken("");
        }}
        onTabChange={(tab) => setAdminTab(tab)}
        onInviteFilterChange={(filter) => setInviteListFilter(filter)}
        onCandidateFilterChange={(filter) => setCandidateListFilter(filter)}
        onDashboardFilterChange={(filter) => setDashboardListFilter(filter)}
        onInviteNameChange={(event) => setInviteName(event.target.value)}
        onInviteEmailChange={(event) => setInviteEmail(event.target.value)}
        onSendInvite={handleSendInvite}
        onBulkReminder={handleBulkReminder}
        onSelectCandidate={(email) => setSelectedCandidateEmail(email)}
      />
    );
  }

  if (isLoggedIn && (profileLoading || !isProfileComplete)) {
    return (
      <AcademicInfoPage
        profile={candidateProfile}
        loading={profileSaveLoading || profileLoading}
        error={profileError}
        onChange={handleProfileFieldChange}
        onSubmit={handleSaveProfile}
        onLogout={() => {
          void logoutCandidate();
        }}
      />
    );
  }

  return (
    <CandidateSessionPage
      sessionEndedScreen={sessionEndedScreen}
      interruptAi={interruptAi}
      disconnectAndLogout={async () => {
        await logoutCandidate();
      }}
      sessionTimer={sessionTimer}
      avatarContainerRef={avatarContainerRef}
      avatarLoading={avatarLoading}
      camOn={camOn}
      camVideoRef={camVideoRef}
      status={status}
      avatarLoaderStep={avatarLoaderStep}
      avatarLoaderSteps={AVATAR_LOADER_STEPS}
      avatarLoaderStatus={AVATAR_LOADER_STATUS}
      visibleMessages={visibleMessages}
      userMessageCount={userMessageCount}
      chatInput={chatInput}
      transcriptBodyRef={transcriptBodyRef}
      avatarReady={avatarReady}
      aiSpeaking={aiSpeaking}
      handleTalkPointerDown={handleTalkPointerDown}
      handleTalkPointerUp={handleTalkPointerUp}
      endConversation={endConversation}
      endingConversation={endingConversation}
      liveSttText={liveSttText}
      socketError={socketError}
      assessmentModal={assessmentModal}
      assessmentAnswers={assessmentAnswers}
      assessmentSubmitted={assessmentSubmitted}
      onChatInputChange={(event) => setChatInput(event.target.value)}
      onSendTextMessage={sendTextMessage}
      onAssessmentAnswer={(questionId, option) => {
        setAssessmentAnswers((prev) => ({ ...prev, [questionId]: option }));
      }}
      onSubmitAssessment={async () => {
        if (assessmentModal.type === "chapter") {
          const formattedAnswers = assessmentModal.questions.map((q) => {
            const selected = assessmentAnswers[q.id];
            return {
              id: q.id,
              question: q.question,
              selected,
              correctAnswer: q.correctAnswer,
              isCorrect: selected === q.correctAnswer,
            };
          });
          try {
            await requestJsonWithFallback(`/data/study/chapters/${assessmentModal.chapterIndex}/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ answers: formattedAnswers }),
            });
            const score = formattedAnswers.filter((item) => item.isCorrect).length;
            const totalQuestions = formattedAnswers.length || 10;
            const nowIso = new Date().toISOString();
            setAssessmentStatuses((prev) => {
              const current = Array.isArray(prev) ? prev : [];
              const existingIdx = current.findIndex(
                (item) => Number(item?.chapterIndex) === Number(assessmentModal.chapterIndex),
              );
              const nextItem = {
                chapterIndex: Number(assessmentModal.chapterIndex),
                score,
                totalQuestions,
                attempts:
                  existingIdx >= 0
                    ? Number(current[existingIdx]?.attempts || 0) + 1
                    : 1,
                updatedAt: nowIso,
              };
              if (existingIdx >= 0) {
                const updated = [...current];
                updated[existingIdx] = { ...updated[existingIdx], ...nextItem };
                return updated;
              }
              return [...current, nextItem];
            });
            setAssessmentSubmitted(true);
            loadAssessmentStatuses(token);
          } catch (error) {
            setReviewToast({
              open: true,
              message: error?.message || "Failed to submit assessment.",
            });
          }
        } else {
          setAssessmentSubmitted(true);
        }
      }}
      onCloseAssessment={() => {
        setAssessmentModal((prev) => ({ ...prev, open: false }));
      }}
      studyProgress={studyProgress}
      assessmentStatuses={assessmentStatuses}
      assessmentLoading={assessmentLoading}
      reviewLoading={reviewLoading}
      onTakeChapterAssessment={handleTakeChapterAssessment}
      onReviewChapterMistakes={handleReviewChapterMistakes}
      reviewToast={reviewToast}
      onDismissReviewToast={() => setReviewToast({ open: false, message: "" })}
      weeklyStudyHours={weeklyStudyHours}
    />
  );
}

export default App;
