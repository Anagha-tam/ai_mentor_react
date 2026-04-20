import { useState, useEffect, useMemo } from 'react';
import { getAttendanceRecords, getInvitedCandidates, sendInvitation } from '../Services/api';
import { formatAgo, formatMinutes, initialsFromEmail } from '../utils/formatters';

export default function AdminDashboardPage({ onLogout }) {
  const [adminRows, setAdminRows] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState('');
  const [candidateRows, setCandidateRows] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [candidateError, setCandidateError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteListFilter, setInviteListFilter] = useState('all');
  const [candidateListFilter, setCandidateListFilter] = useState('all');
  const [dashboardListFilter, setDashboardListFilter] = useState('all');
  const [selectedCandidateEmail, setSelectedCandidateEmail] = useState('');
  const [selectedInvitationEmails, setSelectedInvitationEmails] = useState([]);
  const [bulkActionBusy, setBulkActionBusy] = useState(false);
  const [bulkActionMsg, setBulkActionMsg] = useState('');
  const [overviewTooltip, setOverviewTooltip] = useState(null);
  const [agingTooltip, setAgingTooltip] = useState(null);
  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

  useEffect(() => {
    const load = async () => {
      setAdminLoading(true);
      try {
        const payload = await getAttendanceRecords(100);
        setAdminRows(Array.isArray(payload?.records) ? payload.records : []);
        setAdminError('');
      } catch (err) {
        setAdminError(err.message || 'Failed to fetch attendance.');
      } finally {
        setAdminLoading(false);
      }
    };
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      setCandidateLoading(true);
      try {
        const payload = await getInvitedCandidates();
        const records = Array.isArray(payload?.records) ? payload.records : [];
        setCandidateRows(records);
        setCandidateError('');
        setSelectedCandidateEmail((prev) =>
          records.some((r) => r?.email === prev) ? prev : '',
        );
      } catch (err) {
        setCandidateError(err.message || 'Failed to fetch candidates.');
      } finally {
        setCandidateLoading(false);
      }
    };
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteMessage('');
    setInviteError('');
    if (!inviteName.trim()) { setInviteError('Enter candidate name.'); return; }
    if (!inviteEmail || !inviteEmail.includes('@')) { setInviteError('Enter a valid candidate email.'); return; }
    setInviteSending(true);
    try {
      const payload = await sendInvitation({ name: inviteName.trim(), email: inviteEmail });
      setInviteMessage(payload?.message || 'Invitation sent successfully.');
      setInviteName('');
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation.');
    } finally {
      setInviteSending(false);
    }
  };

  const invitationStatus = (row) => {
    if (row?.attended) return 'completed';
    const minutes = Number(row?.insights?.totalTrainingMinutes || 0);
    if (minutes > 0) return 'inprogress';
    return 'pending';
  };
  const statusConfig = {
    pending: { label: 'Pending', className: 'away' },
    inprogress: { label: 'In progress', className: 'live' },
    completed: { label: 'Completed', className: 'live' },
  };

  const candidateTotals = useMemo(() => {
    const invited = candidateRows.length;
    const attended = candidateRows.filter((r) => r?.attended).length;
    return { invited, attended, pending: Math.max(0, invited - attended) };
  }, [candidateRows]);

  const selectedCandidate = useMemo(
    () => (selectedCandidateEmail ? candidateRows.find((r) => r.email === selectedCandidateEmail) || null : null),
    [candidateRows, selectedCandidateEmail],
  );

  const filteredInvitationRows =
    inviteListFilter === 'completed'
      ? candidateRows.filter((r) => r.attended)
      : inviteListFilter === 'pending'
        ? candidateRows.filter((r) => !r.attended)
        : candidateRows;

  const invitationStats = (() => {
    const total = candidateRows.length;
    const completed = candidateRows.filter((r) => invitationStatus(r) === 'completed').length;
    const inprogress = candidateRows.filter((r) => invitationStatus(r) === 'inprogress').length;
    return { total, completed, inprogress, pending: Math.max(0, total - completed - inprogress) };
  })();

  const weeklyInvites = (() => {
    const now = new Date();
    const slots = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return { key: d.toISOString().slice(0, 10), day: d.toLocaleDateString(undefined, { weekday: 'short' }), val: 0 };
    });
    const byDay = new Map(slots.map((s) => [s.key, s]));
    for (const row of candidateRows) {
      const ts = new Date(row?.lastInvitedAt || row?.firstInvitedAt || Date.now());
      if (Number.isNaN(ts.getTime())) continue;
      ts.setHours(0, 0, 0, 0);
      const slot = byDay.get(ts.toISOString().slice(0, 10));
      if (slot) slot.val += 1;
    }
    return slots;
  })();

  const weeklyMax = Math.max(1, ...weeklyInvites.map((i) => i.val));
  const recentWeekInvited = weeklyInvites.reduce((s, i) => s + i.val, 0);
  const recentWeekCompleted = candidateRows.filter((r) => {
    const ts = new Date(r?.completedAt || 0).getTime();
    return Number.isFinite(ts) && ts > 0 && ts >= Date.now() - 7 * 86400000;
  }).length;

  const needsAttentionRows = useMemo(
    () =>
      candidateRows
        .filter((r) => !r.attended)
        .map((r) => {
          const invitedAt = new Date(r?.lastInvitedAt || r?.firstInvitedAt || Date.now()).getTime();
          const ageHours = Number.isFinite(invitedAt) ? Math.max(0, (Date.now() - invitedAt) / 3600000) : 0;
          const status = invitationStatus(r);
          const reason =
            ageHours >= 72 ? 'Pending for over 3 days'
            : status === 'inprogress' ? 'Started but not completed'
            : 'Invite sent, no progress yet';
          return { ...r, ageHours, reason };
        })
        .filter((r) => {
          const status = invitationStatus(r);
          if (status === 'pending') return r.ageHours >= 48;
          if (status === 'inprogress') return r.ageHours >= 24;
          return false;
        })
        .sort((a, b) => b.ageHours - a.ageHours)
        .slice(0, 5),
    [candidateRows],
  );

  const filteredCandidateRows =
    candidateListFilter === 'completed' ? candidateRows.filter((r) => r.attended)
    : candidateListFilter === 'pending' ? candidateRows.filter((r) => !r.attended)
    : candidateRows;

  const isRowSelected = (email) => selectedInvitationEmails.includes(email);
  const allFilteredSelected =
    filteredInvitationRows.length > 0 &&
    filteredInvitationRows.every((r) => selectedInvitationEmails.includes(r.email));
  const toggleInvitationRow = (email) =>
    setSelectedInvitationEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedInvitationEmails((prev) =>
        prev.filter((e) => !filteredInvitationRows.some((r) => r.email === e)),
      );
      return;
    }
    setSelectedInvitationEmails((prev) => {
      const next = new Set(prev);
      filteredInvitationRows.forEach((r) => next.add(r.email));
      return [...next];
    });
  };
  const selectedInvitationRows = filteredInvitationRows.filter((r) =>
    selectedInvitationEmails.includes(r.email),
  );

  const completionByEmail = new Map(
    candidateRows.map((r) => [String(r.email || '').toLowerCase(), Boolean(r.attended)]),
  );
  const attendanceByEmail = new Map(
    adminRows.map((r) => [String(r?.email || '').toLowerCase(), r]),
  );

  const dashboardBaseRows =
    candidateRows.length > 0
      ? candidateRows.map((c) => {
          const email = String(c?.email || '').toLowerCase();
          const att = attendanceByEmail.get(email);
          return {
            ...(att || {}),
            email: c.email,
            candidateName: c.candidateName || att?.candidateName || '',
            updatedAt: att?.updatedAt || c.lastInvitedAt || c.firstInvitedAt || null,
            completed: Boolean(c.attended),
            insights: att?.insights || { currentlyDetected: false, presentMinutes: 0, awayMinutes: 0, totalTrainingMinutes: 0 },
            note: att?.note || 'No attendance data yet.',
          };
        })
      : adminRows.map((r) => ({
          ...r,
          completed: completionByEmail.get(String(r?.email || '').toLowerCase()) === true,
        }));

  const filteredDashboardRows =
    dashboardListFilter === 'completed' ? dashboardBaseRows.filter((r) => r.completed)
    : dashboardListFilter === 'pending' ? dashboardBaseRows.filter((r) => !r.completed)
    : dashboardListFilter === 'started' ? dashboardBaseRows.filter((r) => Number(r?.insights?.totalTrainingMinutes || 0) > 0)
    : dashboardListFilter === 'invited' ? dashboardBaseRows.filter((r) => completionByEmail.has(String(r?.email || '').toLowerCase()))
    : dashboardBaseRows;

  const dashboardMetrics = (() => {
    const invited = dashboardBaseRows.length;
    const startedRows = dashboardBaseRows.filter((r) => Number(r?.insights?.totalTrainingMinutes || 0) > 0);
    const completed = dashboardBaseRows.filter((r) => r.completed).length;
    const avgPresencePct = startedRows.length
      ? startedRows.reduce((s, r) => {
          const present = Number(r?.insights?.presentMinutes || 0);
          const away = Number(r?.insights?.awayMinutes || 0);
          const total = present + away;
          return s + (total > 0 ? (present / total) * 100 : 0);
        }, 0) / startedRows.length
      : 0;
    const avgTrainingMinutes = startedRows.length
      ? startedRows.reduce((s, r) => s + Number(r?.insights?.totalTrainingMinutes || 0), 0) / startedRows.length
      : 0;
    return {
      invited,
      started: startedRows.length,
      completed,
      pending: Math.max(0, invited - completed),
      avgPresencePct: Number(avgPresencePct.toFixed(1)),
      avgTrainingMinutes: Number(avgTrainingMinutes.toFixed(1)),
      liveNow: dashboardBaseRows.filter((r) => Boolean(r?.insights?.currentlyDetected)).length,
      stalePending: dashboardBaseRows.filter((r) => {
        if (r.completed) return false;
        const updatedAt = new Date(r?.updatedAt || 0).getTime();
        return !Number.isFinite(updatedAt) || updatedAt <= 0 || Date.now() - updatedAt > 48 * 3600000;
      }).length,
    };
  })();

  const completionTrend = (() => {
    const now = new Date();
    const points = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: 0 };
    });
    const byKey = new Map(points.map((p) => [p.key, p]));
    for (const r of candidateRows) {
      if (!r?.attended || !r?.completedAt) continue;
      const dt = new Date(r.completedAt);
      if (Number.isNaN(dt.getTime())) continue;
      dt.setHours(0, 0, 0, 0);
      const point = byKey.get(dt.toISOString().slice(0, 10));
      if (point) point.value += 1;
    }
    return points;
  })();

  const funnelData = [
    { label: 'Invited', value: dashboardMetrics.invited },
    { label: 'Started', value: dashboardMetrics.started },
    { label: 'In Progress', value: Math.max(0, dashboardMetrics.started - dashboardMetrics.completed) },
    { label: 'Completed', value: dashboardMetrics.completed },
  ];

  const pendingAging = (() => {
    const buckets = [
      { label: '0-1d', minH: 0, maxH: 24, count: 0 },
      { label: '2-3d', minH: 24, maxH: 72, count: 0 },
      { label: '4-7d', minH: 72, maxH: 168, count: 0 },
      { label: '>7d', minH: 168, maxH: Infinity, count: 0 },
    ];
    for (const r of dashboardBaseRows) {
      if (r?.completed) continue;
      const invitedMs = new Date(r?.updatedAt || 0).getTime();
      const ageH = Number.isFinite(invitedMs) && invitedMs > 0 ? (Date.now() - invitedMs) / 3600000 : 0;
      const bucket = buckets.find((b) => ageH >= b.minH && ageH < b.maxH);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  })();

  const completionTrendMax = Math.max(1, ...completionTrend.map((p) => p.value));
  const funnelMax = Math.max(1, ...funnelData.map((f) => f.value));
  const pendingAgingMax = Math.max(1, ...pendingAging.map((b) => b.count));
  const trainingOverviewBars = [
    { label: 'Invited', value: dashboardMetrics.invited, tone: '' },
    { label: 'Started', value: dashboardMetrics.started, tone: '' },
    { label: 'Completed', value: dashboardMetrics.completed, tone: '' },
    { label: 'Pending', value: dashboardMetrics.pending, tone: 'warn' },
  ];

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-sb-brand">
          <div className="adm-sb-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M2 8l10 6 10-6" />
            </svg>
          </div>
          <div>
            <div className="adm-sb-title">AI Mentor</div>
            <div className="adm-sb-sub">Admin console</div>
          </div>
        </div>
        <div className="adm-sb-section">Overview</div>
        <button type="button" className={`adm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button type="button" className={`adm-nav-item ${activeTab === 'invitations' ? 'active' : ''}`} onClick={() => setActiveTab('invitations')}>Invitations</button>
        <button type="button" className={`adm-nav-item ${activeTab === 'candidates' ? 'active' : ''}`} onClick={() => setActiveTab('candidates')}>
          Candidates <span className="adm-badge">{candidateTotals.invited}</span>
        </button>
        <div className="adm-sb-spacer" />
        <div className="adm-sb-user">
          <div className="adm-sb-avatar">AD</div>
          <div>
            <p>Admin</p>
            <span>admin@aimentor.io</span>
          </div>
        </div>
      </aside>

      <section className="adm-main">
        <div className="adm-top">
          <div>
            <div className="adm-page-title">
              {activeTab === 'invitations' ? 'Invitations' : activeTab === 'candidates' ? 'Candidates' : 'Dashboard'}
            </div>
            <div className="adm-page-sub">{todayLabel}</div>
          </div>
          <div className="adm-actions">
            <button className="adm-btn-primary" onClick={onLogout}>Logout</button>
          </div>
        </div>

        {activeTab === 'invitations' ? (
          <>
            <div className="adm-stats-grid adm-invite-stats adm-invite-stats-4">
              {[
                { label: 'Total invited', val: invitationStats.total, sub: 'All invitations', filter: 'all' },
                { label: 'Completed', val: invitationStats.completed, sub: 'Fully completed', filter: 'completed' },
                { label: 'In progress', val: invitationStats.inprogress, sub: 'Started but not done', filter: 'all' },
                { label: 'Pending', val: invitationStats.pending, sub: 'Yet to start', filter: 'pending' },
              ].map(({ label, val, sub, filter }) => (
                <button key={label} type="button" className={`adm-stat-card adm-stat-click ${inviteListFilter === filter && filter !== 'all' ? 'active' : ''}`} onClick={() => setInviteListFilter(filter)}>
                  <div className="adm-stat-label">{label}</div>
                  <div className="adm-stat-val">{val}</div>
                  <div className="adm-stat-sub">{sub}</div>
                </button>
              ))}
            </div>
            <div className="adm-content-row adm-invitations-layout">
              <div className="adm-invite-left">
                <div className="adm-card">
                  <div className="adm-card-header"><p>Send mentoring invitation</p><span>Email candidate access link</span></div>
                  <div className="adm-invite-body">
                    <div className="adm-invite-banner">
                      <div className="adm-invite-icon">✉</div>
                      <div>
                        <p>Invite a candidate to start AI mentoring</p>
                        <span>The candidate receives a secure mail and appears in the tracker.</span>
                      </div>
                    </div>
                    <form className="adm-invite-form" onSubmit={handleSendInvite}>
                      <div className="adm-invite-grid">
                        <div>
                          <label htmlFor="invite-name" className="adm-invite-label">Candidate name</label>
                          <input id="invite-name" type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Enter candidate name" required className="adm-invite-input" />
                        </div>
                        <div>
                          <label htmlFor="invite-email" className="adm-invite-label">Candidate email</label>
                          <input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="candidate@company.com" required className="adm-invite-input" />
                        </div>
                      </div>
                      <div className="adm-invite-input-row">
                        <button className="adm-btn-primary adm-invite-btn" type="submit" disabled={inviteSending}>
                          {inviteSending ? 'Sending...' : 'Send invite'}
                        </button>
                      </div>
                      {inviteMessage && <p className="adm-invite-msg success">{inviteMessage}</p>}
                      {inviteError && <p className="adm-invite-msg error">{inviteError}</p>}
                    </form>
                  </div>
                </div>
                <div className="adm-card">
                  <div className="adm-card-header"><p>All candidates</p><span>{filteredInvitationRows.length} records</span></div>
                  {selectedInvitationRows.length > 0 && (
                    <div className="adm-bulk-row">
                      <span>{selectedInvitationRows.length} selected</span>
                      <button className="adm-btn-outline" disabled={bulkActionBusy}>
                        {bulkActionBusy ? 'Sending...' : 'Send reminder'}
                      </button>
                      {bulkActionMsg && <em>{bulkActionMsg}</em>}
                    </div>
                  )}
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th><input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} /></th>
                        <th>Candidate</th><th>Status</th><th>Progress</th><th>Invited</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvitationRows.map((row) => {
                        const st = invitationStatus(row);
                        const cfg = statusConfig[st];
                        const total = Number(row?.insights?.totalTrainingMinutes || 0);
                        const progress = row.attended ? 100 : total > 0 ? 60 : 0;
                        return (
                          <tr key={`tbl-${row.email}`}>
                            <td><input type="checkbox" checked={isRowSelected(row.email)} onChange={() => toggleInvitationRow(row.email)} /></td>
                            <td>
                              <div className="adm-candidate-cell">
                                <div className="adm-cand-avatar">{initialsFromEmail(row.email)}</div>
                                <div><div className="adm-cand-name">{row.candidateName || row.email}</div><div className="adm-cand-sub">{row.email}</div></div>
                              </div>
                            </td>
                            <td><span className={`adm-status-pill ${cfg.className}`}>{cfg.label}</span></td>
                            <td>
                              <div className="adm-table-progress">
                                <div className="adm-table-progress-track"><div className="adm-table-progress-fill" style={{ width: `${progress}%` }} /></div>
                                <span>{progress}%</span>
                              </div>
                            </td>
                            <td>{formatAgo(row.lastInvitedAt)}</td>
                          </tr>
                        );
                      })}
                      {filteredInvitationRows.length === 0 && <tr><td colSpan={5}>No candidates in this list.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="adm-side-col">
                <div className="adm-card">
                  <div className="adm-card-header"><p>Activity feed</p><span>Live</span></div>
                  <div className="adm-activity-list">
                    {candidateRows.slice(0, 6).map((row) => {
                      const st = invitationStatus(row);
                      const cfg = statusConfig[st];
                      const title = st === 'completed' ? `${row.candidateName || row.email} completed mentoring` : st === 'inprogress' ? `${row.candidateName || row.email} opened module` : `${row.candidateName || row.email} invited`;
                      return (
                        <div className="adm-activity-item" key={`act-${row.email}`}>
                          <div className={`adm-act-avatar ${cfg.className}`}>{initialsFromEmail(row.email)}</div>
                          <div className="adm-activity-content">
                            <p>{title}</p>
                            <span>{row.email}</span>
                            <span>{formatAgo(row.lastInvitedAt)}</span>
                          </div>
                          <span className={`adm-status-pill ${cfg.className}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                    {candidateRows.length === 0 && (
                      <div className="adm-activity-item">
                        <div className="adm-act-dot away" />
                        <div><p>No activity yet</p><span>Start by sending your first invite.</span></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="adm-card">
                  <div className="adm-card-header"><p>Needs attention</p><span>Follow-up queue</span></div>
                  <div className="adm-activity-list">
                    {needsAttentionRows.map((row) => (
                      <div className="adm-activity-item" key={`need-${row.email}`}>
                        <div className="adm-act-dot away" />
                        <div className="adm-activity-content"><p>{row.candidateName || row.email}</p><span>{row.reason}</span><span>{row.email}</span></div>
                        <span className="adm-status-pill away">Pending</span>
                      </div>
                    ))}
                    {needsAttentionRows.length === 0 && (
                      <div className="adm-activity-item">
                        <div className="adm-act-dot live" />
                        <div className="adm-activity-content"><p>All clear</p><span>No pending candidates need immediate follow-up.</span></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="adm-card">
                  <div className="adm-card-header"><p>Invites this week</p><span>Daily activity</span></div>
                  <div className="adm-week-chart">
                    {weeklyInvites.map((item) => {
                      const h = Math.max(8, Math.round((item.val / weeklyMax) * 58));
                      return (
                        <div className="adm-week-col" key={item.day}>
                          <div className="adm-week-bar-wrap">
                            <div className="adm-week-bar-hit">
                              <div className="adm-week-bar" style={{ height: `${h}px`, opacity: item.val > 0 ? 1 : 0.35 }} />
                              <div className="adm-week-tooltip">{item.day}: {item.val} invite{item.val === 1 ? '' : 's'}</div>
                            </div>
                          </div>
                          <span>{item.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="adm-week-meta">
                    <span>Invited (7d): {recentWeekInvited}</span>
                    <span>Completed (7d): {recentWeekCompleted}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'candidates' ? (
          <>
            <div className="adm-stats-grid">
              {[
                { label: 'Invited candidates', val: candidateTotals.invited, filter: 'all' },
                { label: 'Attended', val: candidateTotals.attended, filter: 'completed' },
                { label: 'Pending', val: candidateTotals.pending, filter: 'pending' },
              ].map(({ label, val, filter }) => (
                <button key={label} type="button" className={`adm-stat-card adm-stat-click ${candidateListFilter === filter ? 'active' : ''}`} onClick={() => setCandidateListFilter(filter)}>
                  <div className="adm-stat-label">{label}</div>
                  <div className="adm-stat-val">{val}</div>
                </button>
              ))}
            </div>
            <div className="adm-stats-grid">
              <div className="adm-stat-card"><div className="adm-stat-label">Average presence</div><div className="adm-stat-val">{dashboardMetrics.avgPresencePct}%</div></div>
              <div className="adm-stat-card"><div className="adm-stat-label">Avg mentoring time</div><div className="adm-stat-val">{formatMinutes(dashboardMetrics.avgTrainingMinutes)} min</div></div>
              <div className="adm-stat-card"><div className="adm-stat-label">Live now</div><div className="adm-stat-val">{dashboardMetrics.liveNow}</div></div>
              <div className="adm-stat-card"><div className="adm-stat-label">Needs follow-up</div><div className="adm-stat-val">{dashboardMetrics.stalePending}</div></div>
            </div>
            {candidateError && <p className="error-note">{candidateError}</p>}
            <div className="adm-content-row adm-candidates-layout">
              <div className="adm-card">
                <div className="adm-card-header"><p>Invited candidates</p><span>{candidateLoading ? 'Refreshing...' : `Showing ${filteredCandidateRows.length} candidates`}</span></div>
                <table className="adm-table">
                  <thead><tr><th>Candidate</th><th>Status</th><th>Invites</th><th>Invited</th><th>Last Attended</th></tr></thead>
                  <tbody>
                    {filteredCandidateRows.map((row) => (
                      <tr key={row.email} onClick={() => setSelectedCandidateEmail(row.email)} className={`adm-click-row ${selectedCandidate?.email === row.email ? 'is-selected' : ''}`}>
                        <td>
                          <div className="adm-candidate-cell">
                            <div className="adm-cand-avatar">{initialsFromEmail(row.email)}</div>
                            <div><div className="adm-cand-name">{row.candidateName || row.email}</div><div className="adm-cand-sub">{row.email} · Invited by {row.invitedBy || 'admin'}</div></div>
                          </div>
                        </td>
                        <td><span className={`adm-status-pill ${row.attended ? 'live' : 'away'}`}>{row.attended ? 'Attended' : 'Pending'}</span></td>
                        <td>{row.inviteCount || 0}</td>
                        <td>{formatAgo(row.lastInvitedAt)}</td>
                        <td>{row.lastAttendedAt ? formatAgo(row.lastAttendedAt) : '-'}</td>
                      </tr>
                    ))}
                    {!candidateLoading && filteredCandidateRows.length === 0 && <tr><td colSpan={5}>No invited candidates yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="adm-side-col">
                <div className="adm-card">
                  <div className="adm-card-header"><p>Candidate detail</p><span>{selectedCandidate ? `${selectedCandidate.candidateName || selectedCandidate.email}` : 'Select a candidate row'}</span></div>
                  {!selectedCandidate ? (
                    <p className="adm-detail-empty">Click a candidate to view attendance insights.</p>
                  ) : (
                    <div className="adm-detail-body">
                      {[
                        ['Detected', selectedCandidate?.insights?.currentlyDetected ? 'Yes' : 'No'],
                        ['In Front (min)', formatMinutes(selectedCandidate?.insights?.presentMinutes || 0)],
                        ['Away (min)', formatMinutes(selectedCandidate?.insights?.awayMinutes || 0)],
                        ['Total Training (min)', formatMinutes(selectedCandidate?.insights?.totalTrainingMinutes || 0)],
                        ['Updated', selectedCandidate?.attendanceUpdatedAt ? formatAgo(selectedCandidate.attendanceUpdatedAt) : '-'],
                      ].map(([label, value]) => (
                        <div key={label} className="adm-detail-row"><span>{label}</span><b>{value}</b></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="adm-stats-grid">
              {[
                { label: 'Invited candidates', val: dashboardMetrics.invited, filter: 'all' },
                { label: 'Started mentoring', val: dashboardMetrics.started, filter: 'started' },
                { label: 'Completed mentoring', val: dashboardMetrics.completed, filter: 'completed' },
                { label: 'Candidates pending', val: dashboardMetrics.pending, filter: 'pending' },
              ].map(({ label, val, filter }) => (
                <button key={label} type="button" className={`adm-stat-card adm-stat-click ${dashboardListFilter === filter ? 'active' : ''}`} onClick={() => setDashboardListFilter(filter)}>
                  <div className="adm-stat-label">{label}</div>
                  <div className="adm-stat-val">{val}</div>
                </button>
              ))}
            </div>
            <div className="adm-charts-top-row">
              <div className="adm-card adm-card-compact">
                <div className="adm-card-header"><p>Completion Trend (30d)</p><span>Daily completions</span></div>
                <div className="adm-chart-wrap">
                  <svg viewBox="0 0 320 130" className="adm-line-chart">
                    <polyline fill="none" stroke="#534ab7" strokeWidth="2" points={completionTrend.map((p, idx) => { const x = (idx / Math.max(1, completionTrend.length - 1)) * 300 + 10; const y = 110 - (p.value / completionTrendMax) * 90; return `${x},${y}`; }).join(' ')} />
                  </svg>
                  <div className="adm-chart-meta"><span>Last 30 days</span><span>Total: {completionTrend.reduce((s, p) => s + p.value, 0)}</span></div>
                </div>
              </div>
              <div className="adm-card adm-card-compact">
                <div className="adm-card-header"><p>Pipeline Funnel</p><span>Candidate flow</span></div>
                <div className="adm-mini-bars">
                  {funnelData.map((item) => (
                    <div className="adm-mini-bar-row" key={item.label}>
                      <span>{item.label}</span>
                      <div className="adm-mini-bar-track"><div className="adm-mini-bar-fill" style={{ width: `${Math.round((item.value / funnelMax) * 100)}%` }} /></div>
                      <b>{item.value}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="adm-card adm-card-compact">
                <div className="adm-card-header"><p>Pending Aging</p><span>Age buckets</span></div>
                <div className="adm-chart-wrap">
                  <svg viewBox="0 0 320 130" className="adm-line-chart" onMouseLeave={() => setAgingTooltip(null)}>
                    <polyline fill="none" stroke="#ef9f27" strokeWidth="2" points={pendingAging.map((b, idx) => { const x = (idx / Math.max(1, pendingAging.length - 1)) * 300 + 10; const y = 110 - (b.count / pendingAgingMax) * 90; return `${x},${y}`; }).join(' ')} />
                    {pendingAging.map((bucket, idx) => {
                      const x = (idx / Math.max(1, pendingAging.length - 1)) * 300 + 10;
                      const y = 110 - (bucket.count / pendingAgingMax) * 90;
                      return <circle key={bucket.label} cx={x} cy={y} r="5" fill="#ef9f27" onMouseEnter={() => setAgingTooltip({ left: `${clamp((x / 320) * 100, 12, 88)}%`, top: `${clamp((y / 130) * 100, 14, 92)}%`, place: y < 30 ? 'below' : 'above', text: `${bucket.label}: ${bucket.count}` })} />;
                    })}
                  </svg>
                  {agingTooltip && <div className={`adm-inline-tooltip ${agingTooltip.place === 'below' ? 'below' : ''}`} style={{ left: agingTooltip.left, top: agingTooltip.top }}>{agingTooltip.text}</div>}
                  <div className="adm-chart-axis">{pendingAging.map((b) => <span key={b.label}>{b.label}</span>)}</div>
                  <div className="adm-chart-meta"><span>Pending buckets</span><span>Total: {pendingAging.reduce((s, b) => s + b.count, 0)}</span></div>
                </div>
              </div>
            </div>
            {adminError && <p className="error-note">{adminError}</p>}
            <div className="adm-content-row">
              <div className="adm-card">
                <div className="adm-card-header">
                  <p>Candidate attendance</p>
                  <span>{adminLoading ? 'Refreshing...' : `${filteredDashboardRows.length} candidates`}</span>
                </div>
                <table className="adm-table">
                  <thead><tr><th>Candidate</th><th>Status</th><th>Live Time (min)</th><th>Offline Time (min)</th><th>Total Training (min)</th><th>Presence %</th><th>Updated</th></tr></thead>
                  <tbody>
                    {filteredDashboardRows.map((row) => {
                      const liveMinutes = Number(row?.insights?.presentMinutes || 0);
                      const awayMinutes = Number(row?.insights?.awayMinutes || 0);
                      const totalMinutes = Number(row?.insights?.totalTrainingMinutes || 0);
                      const presencePct = totalMinutes > 0 ? Number(((liveMinutes / totalMinutes) * 100).toFixed(1)) : 0;
                      const isLiveNow = Boolean(row?.insights?.currentlyDetected);
                      const statusLabel = isLiveNow ? 'Live now' : row.completed ? 'Completed' : liveMinutes > 0 ? 'In progress' : 'Not started';
                      const statusClass = row.completed || isLiveNow || liveMinutes > 0 ? 'live' : 'away';
                      return (
                        <tr key={row.userId || row._id || row.email}>
                          <td>
                            <div className="adm-candidate-cell">
                              <div className="adm-cand-avatar">{initialsFromEmail(row.email || row.userId)}</div>
                              <div><div className="adm-cand-name">{row.candidateName || row.email || row.userId || 'unknown'}</div><div className="adm-cand-sub">{row.note || 'No note'}</div></div>
                            </div>
                          </td>
                          <td><span className={`adm-status-pill ${statusClass}`}>{statusLabel}</span></td>
                          <td>{formatMinutes(liveMinutes)}</td>
                          <td>{formatMinutes(awayMinutes)}</td>
                          <td>{formatMinutes(totalMinutes)}</td>
                          <td>{totalMinutes > 0 ? `${presencePct}%` : '-'}</td>
                          <td>{formatAgo(row.updatedAt)}</td>
                        </tr>
                      );
                    })}
                    {!adminLoading && filteredDashboardRows.length === 0 && <tr><td colSpan={7}>No attendance data yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="adm-side-col">
                <div className="adm-card">
                  <div className="adm-card-header"><p>Training overview</p><span>Bar chart</span></div>
                  <div className="adm-chart-wrap">
                    <svg viewBox="0 0 320 150" className="adm-bar-chart" onMouseLeave={() => setOverviewTooltip(null)}>
                      {trainingOverviewBars.map((item, idx) => {
                        const x = 28 + idx * 72;
                        const h = (item.value / Math.max(1, dashboardMetrics.invited)) * 92;
                        const y = 112 - h;
                        return (
                          <g key={item.label}>
                            <rect x={x} y={y} width="40" height={h} rx="6" className={item.tone === 'warn' ? 'adm-bar warn' : 'adm-bar'} onMouseEnter={() => setOverviewTooltip({ left: `${clamp(((x + 20) / 320) * 100, 12, 88)}%`, top: `${clamp((y / 150) * 100, 14, 92)}%`, place: y < 32 ? 'below' : 'above', text: `${item.label}: ${item.value}` })} />
                            <text x={x + 20} y="126" textAnchor="middle" className="adm-bar-label">{item.label}</text>
                            <text x={x + 20} y={y - 4} textAnchor="middle" className="adm-bar-value">{item.value}</text>
                          </g>
                        );
                      })}
                    </svg>
                    {overviewTooltip && <div className={`adm-inline-tooltip ${overviewTooltip.place === 'below' ? 'below' : ''}`} style={{ left: overviewTooltip.left, top: overviewTooltip.top }}>{overviewTooltip.text}</div>}
                  </div>
                  <div className="adm-chart-meta"><span>Completion rate</span><span>{dashboardMetrics.invited ? `${Math.round((dashboardMetrics.completed / dashboardMetrics.invited) * 100)}%` : '0%'}</span></div>
                </div>
                <div className="adm-card">
                  <div className="adm-card-header"><p>Live activity</p><span>Latest updates</span></div>
                  <div className="adm-activity-list">
                    {filteredDashboardRows.slice(0, 5).map((row) => (
                      <div className="adm-activity-item" key={`act-${row.userId || row._id || row.email}`}>
                        <div className={`adm-act-dot ${row?.insights?.currentlyDetected ? 'live' : 'away'}`} />
                        <div>
                          <p>{row.email || row.userId || 'Candidate'} is {row?.insights?.currentlyDetected ? 'in frame' : 'out of frame'}</p>
                          <span>{formatAgo(row.updatedAt)}</span>
                        </div>
                      </div>
                    ))}
                    {!adminLoading && filteredDashboardRows.length === 0 && (
                      <div className="adm-activity-item">
                        <div className="adm-act-dot away" />
                        <div><p>No recent activity</p><span>Waiting for pings...</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
