import { useEffect, useMemo, useRef, useState } from 'react';
import {
  firebaseAuth,
  getIdToken,
  hasFirebaseConfig,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from './services/firebase';
import strategyMap from './assets/strategy-map.png';
import './index.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const jobMarks = {
  'lord-knight': 'LK',
  assassin: 'AS',
  stalker: 'ST',
  minstrel: 'MI',
  gypsy: 'GY',
  paladin: 'PA',
  biochemist: 'BC',
  professor: 'PF',
  'high-wizard': 'HW',
  whitesmith: 'WS',
  'high-priest': 'HP',
  doram: 'DO',
  sniper: 'SN',
  monk: 'MO',
};

const defaultJobs = [
  { id: 1, name: 'Lord Knight', slug: 'lord-knight', order: 'Vanguard' },
  { id: 2, name: 'Assassin', slug: 'assassin', order: 'Shadow' },
  { id: 3, name: 'Stalker', slug: 'stalker', order: 'Shadow' },
  { id: 4, name: 'Minstrel', slug: 'minstrel', order: 'Bardic' },
  { id: 5, name: 'Gypsy', slug: 'gypsy', order: 'Bardic' },
  { id: 6, name: 'Paladin', slug: 'paladin', order: 'Aegis' },
  { id: 7, name: 'Biochemist', slug: 'biochemist', order: 'Alchemy' },
  { id: 8, name: 'Professor', slug: 'professor', order: 'Arcane' },
  { id: 9, name: 'High Wizard', slug: 'high-wizard', order: 'Arcane' },
  { id: 10, name: 'Whitesmith', slug: 'whitesmith', order: 'Forge' },
  { id: 11, name: 'High Priest', slug: 'high-priest', order: 'Sanctum' },
  { id: 12, name: 'Doram', slug: 'doram', order: 'Scout' },
  { id: 13, name: 'Sniper', slug: 'sniper', order: 'Ranger' },
  { id: 14, name: 'Monk', slug: 'monk', order: 'Sanctum' },
];

const fallbackRoles = [
  {
    id: 'admin',
    name: 'Admin',
    tone: 'Command',
    permissions: ['Manage members', 'Create events', 'Edit roles'],
  },
  {
    id: 'user',
    name: 'User',
    tone: 'Scout',
    permissions: ['View dashboard', 'View members'],
  },
];

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'members', label: 'Members', icon: 'members' },
  { key: 'events', label: 'Events', icon: 'events' },
  { key: 'lineups', label: 'Lineup', icon: 'lineup' },
  { key: 'strategy', label: 'Strategy', icon: 'strategy' },
  { key: 'jobs', label: 'Jobs', icon: 'jobs' },
];

const memberStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'toon', label: 'Toon' },
  { value: 'observation', label: 'Observation' },
  { value: 'bye-bye', label: 'Bye Bye' },
  { value: 'poor-attendance', label: 'Poor Attendance' },
];

const memberPositions = [
  'Guild Master',
  'Vice Guild Master',
  'Commander',
  'Charisma Baby',
  'Officer',
  'Kumo',
  'Noroi',
  'Member',
  'NEW',
];

const memberPositionFilters = ['NEW', 'Noroi', 'Kumo', 'Member'];

const positionRanks = {
  'Guild Master': 1,
  'Vice Guild Master': 2,
  Commander: 3,
  'Charisma Baby': 4,
  Officer: 5,
  Kumo: 6,
  Noroi: 7,
  Member: 8,
  NEW: 9,
  Leader: 1,
  Vice: 2,
  KUMO: 6,
  NOROI: 7,
};

const emptyDashboard = {
  summary: {
    totalMembers: 0,
    totalEvents: 0,
    totalAttendances: 0,
  },
  members: [],
};

const strategyPinsStorageKey = 'youkai-strategy-pins-v1';

const defaultStrategyPins = [
  { team_number: 1, x: 50, y: 48 },
  { team_number: 2, x: 31, y: 23 },
  { team_number: 3, x: 67, y: 25 },
  { team_number: 4, x: 28, y: 58 },
  { team_number: 5, x: 72, y: 60 },
  { team_number: 6, x: 42, y: 75 },
  { team_number: 7, x: 79, y: 78 },
  { team_number: 8, x: 19, y: 79 },
];

async function apiRequest(path, options = {}) {
  const token = await getIdToken();
  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

async function apiGet(path) {
  return apiRequest(path);
}

async function apiPut(path, body) {
  return apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function apiDelete(path) {
  return apiRequest(path, {
    method: 'DELETE',
  });
}

function Icon({ name, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {name === 'dashboard' && (
        <>
          <path d="M4 13h7V4H4v9Z" />
          <path d="M13 20h7V4h-7v16Z" />
          <path d="M4 20h7v-5H4v5Z" />
        </>
      )}
      {name === 'members' && (
        <>
          <path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" />
          <path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M20 18c0-1.7-1.1-3.1-2.7-3.7" />
          <path d="M15.5 4.4a3.6 3.6 0 0 1 0 6.8" />
        </>
      )}
      {name === 'events' && (
        <>
          <path d="M7 3v4" />
          <path d="M17 3v4" />
          <path d="M4 8h16" />
          <path d="M5 5h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z" />
          <path d="m8 14 2.2 2.2L16 11" />
        </>
      )}
      {name === 'lineup' && (
        <>
          <path d="M4 5h7v6H4V5Z" />
          <path d="M13 5h7v6h-7V5Z" />
          <path d="M4 13h7v6H4v-6Z" />
          <path d="M13 13h7v6h-7v-6Z" />
          <path d="M7.5 8h.01" />
          <path d="M16.5 8h.01" />
          <path d="M7.5 16h.01" />
          <path d="M16.5 16h.01" />
        </>
      )}
      {name === 'jobs' && (
        <>
          <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" />
          <path d="M12 8v8" />
          <path d="M8 10.5 12 8l4 2.5" />
          <path d="M8 13.5 12 16l4-2.5" />
        </>
      )}
      {name === 'strategy' && (
        <>
          <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
          <path d="M6.5 9.5h.01" />
          <path d="M17.5 14.5h.01" />
        </>
      )}
      {name === 'plus' && (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      )}
      {name === 'edit' && (
        <>
          <path d="M4 20h4l11-11-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
        </>
      )}
      {name === 'trash' && (
        <>
          <path d="M5 7h14" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M7 7l1 13h8l1-13" />
          <path d="M9 7V4h6v3" />
        </>
      )}
      {name === 'x' && (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      )}
      {name === 'chevronLeft' && <path d="m15 18-6-6 6-6" />}
      {name === 'chevronRight' && <path d="m9 18 6-6-6-6" />}
      {name === 'menu' && (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
      {name === 'shield' && (
        <>
          <path d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z" />
          <path d="M12 8v8" />
          <path d="M8.5 11.5h7" />
        </>
      )}
      {name === 'signal' && (
        <>
          <path d="M4 18h2" />
          <path d="M9 18h2v-5H9v5Z" />
          <path d="M14 18h2V9h-2v9Z" />
          <path d="M19 18h1V5h-1v13Z" />
        </>
      )}
    </svg>
  );
}

function JobBadge({ name, slug }) {
  return (
    <span className={`job-badge job-${slug || 'default'}`}>
      <span>{jobMarks[slug] || '--'}</span>
      {name || '-'}
    </span>
  );
}

function getStatusLabel(status) {
  return (
    memberStatuses.find((item) => item.value === status)?.label ||
    memberStatuses[0].label
  );
}

function normalizePosition(position) {
  const rawPosition = String(position || 'Member').trim();
  const match = memberPositions.find(
    (item) => item.toLowerCase() === rawPosition.toLowerCase(),
  );

  if (match) {
    return match;
  }

  if (rawPosition.toLowerCase() === 'leader') {
    return 'Guild Master';
  }

  if (rawPosition.toLowerCase() === 'vice') {
    return 'Vice Guild Master';
  }

  return 'Member';
}

function getPositionRank(position) {
  return positionRanks[normalizePosition(position)] || 99;
}

function getSortableMemberId(member) {
  const numericId = Number(member.id);

  if (Number.isFinite(numericId)) {
    return numericId;
  }

  return Number(String(member.id || '').replace(/\D/g, '')) || 0;
}

function getLineupJobClass(member) {
  const slug = String(
    member?.job_slug ||
      member?.jobSlug ||
      member?.job_name ||
      member?.jobName ||
      'empty',
  )
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-');

  return `lineup-job-${slug}`;
}

function getSlotKey(slot) {
  return `${slot.team_number}-${slot.slot_number}`;
}

function getNextOpenSlotKey(teams, currentSlotKey) {
  const slots = teams.flatMap((team) => team.slots);
  const currentIndex = slots.findIndex((slot) => getSlotKey(slot) === currentSlotKey);
  const orderedSlots =
    currentIndex === -1
      ? slots
      : [...slots.slice(currentIndex + 1), ...slots.slice(0, currentIndex)];
  const nextOpenSlot = orderedSlots.find((slot) => !slot.member_id);

  return nextOpenSlot ? getSlotKey(nextOpenSlot) : currentSlotKey;
}

function StatusBadge({ status }) {
  const safeStatus = status || 'active';

  return (
    <span className={`status-badge status-${safeStatus}`}>
      {getStatusLabel(safeStatus)}
    </span>
  );
}

function StatCard({ label, value, helper, accent }) {
  return (
    <article className={`stat-card accent-${accent}`}>
      <p>{label}</p>
      <h2>{value}</h2>
      <span>{helper}</span>
    </article>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-mark">Y</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function ProfileChip({ activeRole, roles }) {
  const role = roles.find((item) => item.id === activeRole) || roles[0];

  return (
    <div className="profile-chip">
      <div className="profile-avatar">{role?.name?.slice(0, 1) || 'A'}</div>

      <div>
        <strong>{role?.name || 'Admin'}</strong>
        <span>{role?.tone || 'Command'} access</span>
      </div>
    </div>
  );
}

function RoleSwitch({ activeRole, roles, onChange, disabled = false }) {
  return (
    <div className="role-switch" aria-label="Role mode">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          className={activeRole === role.id ? 'active' : ''}
          disabled={disabled}
          onClick={() => onChange(role.id)}
        >
          {role.name}
        </button>
      ))}
    </div>
  );
}

function AuthPanel({
  activeRole,
  authError,
  authLoading,
  authProfile,
  currentUser,
  onSignIn,
  onSignOut,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSignIn(email, password);
    setPassword('');
  }

  if (currentUser) {
    return (
      <div className="auth-card">
        <div className="auth-card-header">
          <span>Firebase Gate</span>
          <strong>{activeRole}</strong>
        </div>

        <div className="auth-user">
          <div className="profile-avatar">
            {(authProfile?.email || currentUser.email || 'U').slice(0, 1)}
          </div>
          <div>
            <strong>{authProfile?.email || currentUser.email}</strong>
            <span>{authProfile?.role || activeRole} access</span>
          </div>
        </div>

        {authError && <p className="auth-error">{authError}</p>}

        <button
          className="ghost-button auth-action"
          type="button"
          onClick={onSignOut}
          disabled={authLoading}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div className="auth-card-header">
        <span>Firebase Gate</span>
        <strong>User</strong>
      </div>

      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        <span>Password</span>
        <input
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {authError && <p className="auth-error">{authError}</p>}

      <button className="primary-button auth-action" type="submit" disabled={authLoading}>
        {authLoading ? 'Signing In' : 'Sign In'}
      </button>
    </form>
  );
}

function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>

      {children}
    </div>
  );
}

function AdminNotice({ canManage, action }) {
  if (canManage) {
    return null;
  }

  return (
    <div className="access-notice">
      <Icon name="shield" />
      <div>
        <strong>Admin access required</strong>
        <span>Current role is User, so you can view this page but cannot {action}.</span>
      </div>
    </div>
  );
}

function DashboardPage({ activeRole, roles }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const role = roles.find((item) => item.id === activeRole) || roles[0];
  const itemsPerPage = 10;
  const totalMembers = dashboard.members.length;
  const totalPages = Math.max(1, Math.ceil(totalMembers / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const displayedMembers = dashboard.members.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialDashboard() {
      try {
        const data = await apiGet('/api/dashboard');

        if (isMounted) {
          setDashboard(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Backend is not reachable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  function goToPage(page) {
    setCurrentPage(page);
  }

  return (
    <div className="page-content">
      <PageHeader eyebrow="Youkai Activity Overview" title="War Council">
        <ProfileChip activeRole={activeRole} roles={roles} />
      </PageHeader>

      {errorMessage && (
        <div className="alert-card">Backend error: {errorMessage}</div>
      )}

      <div className="command-strip">
        <div>
          <span>Current Role</span>
          <strong>{role?.name || 'Admin'}</strong>
        </div>
        <div>
          <span>Access Tone</span>
          <strong>{role?.tone || 'Command'}</strong>
        </div>
        <div>
          <span>Signal</span>
          <strong>{activeRole === 'admin' ? 'Aegis Prime' : 'Scout Read'}</strong>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          accent="gold"
          label="Members"
          value={dashboard.summary.totalMembers}
          helper="Registered roster"
        />

        <StatCard
          accent="teal"
          label="Events"
          value={dashboard.summary.totalEvents}
          helper="Recorded campaigns"
        />

        <StatCard
          accent="red"
          label="Activity Score"
          value={dashboard.summary.totalAttendances}
          helper="Checked attendances"
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Roster telemetry</p>
            <h3>Member Activity Score</h3>
            <span>
              1 event checklist = +1 score. Showing {displayedMembers.length} of{' '}
              {totalMembers} members.
            </span>
          </div>
        </div>

        {loading ? (
          <EmptyState
            title="Loading dashboard"
            description="Reading guild activity data from the backend."
          />
        ) : displayedMembers.length === 0 ? (
          <EmptyState
            title="No member data"
            description="Member and attendance records will appear here after they are created."
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nickname</th>
                    <th>Job</th>
                    <th>Position</th>
                    <th className="text-right">Activity Score</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td>
                        <span className="rank-badge">
                          #{startIndex + index + 1}
                        </span>
                      </td>
                      <td className="nickname-cell">{member.nickname}</td>
                      <td>
                        <JobBadge
                          name={member.job_name}
                          slug={member.job_slug}
                        />
                      </td>
                      <td>{member.position}</td>
                      <td className="text-right score-cell">
                        {member.activity_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                className="pagination-button icon-button-text"
                onClick={goToPreviousPage}
                disabled={safeCurrentPage === 1}
              >
                <Icon name="chevronLeft" />
                Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      className={`pagination-number ${
                        safeCurrentPage === page ? 'active' : ''
                      }`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-button icon-button-text"
                onClick={goToNextPage}
                disabled={safeCurrentPage === totalPages}
              >
                Next
                <Icon name="chevronRight" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MembersPage({ canManage, activeRole, roles }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePositionFilter, setActivePositionFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    nickname: '',
    job_slug: defaultJobs[0].slug,
    position: 'Member',
    status: 'active',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      try {
        const data = await apiGet('/api/members');

        if (isMounted) {
          setMembers(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Member data is not reachable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusSummary = useMemo(() => {
    const statusItems = memberStatuses.map((status) => ({
      ...status,
      count: members.filter((member) => (member.status || 'active') === status.value)
        .length,
    }));

    return [
      {
        value: 'all',
        label: 'All',
        count: members.length,
      },
      ...statusItems,
    ];
  }, [members]);

  const displayedMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    return [...members]
      .filter((member) => {
        if (activeStatusFilter === 'all') {
          return true;
        }

        return (member.status || 'active') === activeStatusFilter;
      })
      .filter((member) => {
        if (activePositionFilter === 'all') {
          return true;
        }

        return normalizePosition(member.position) === activePositionFilter;
      })
      .filter((member) => {
        if (!search) {
          return true;
        }

        return [
          member.nickname,
          member.job_name,
          member.job_slug,
          normalizePosition(member.position),
          getStatusLabel(member.status),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((first, second) => {
        const scoreDifference =
          Number(second.activity_score || 0) - Number(first.activity_score || 0);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        const positionDifference =
          getPositionRank(first.position) - getPositionRank(second.position);

        if (positionDifference !== 0) {
          return positionDifference;
        }

        return getSortableMemberId(first) - getSortableMemberId(second);
      });
  }, [activePositionFilter, activeStatusFilter, memberSearch, members]);

  async function handleMemberUpdate(memberId, payload, fallbackMessage) {
    if (!canManage) {
      return;
    }

    setSavingMemberId(memberId);
    setErrorMessage('');

    try {
      const data = await apiPut(`/api/members/${memberId}`, payload);
      setMembers(data);
    } catch (error) {
      setErrorMessage(error.message || fallbackMessage);
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleActivityScoreChange(memberId, delta) {
    if (!canManage) {
      return;
    }

    setSavingMemberId(memberId);
    setErrorMessage('');

    try {
      const data = await apiPut(`/api/members/${memberId}/score`, { delta });
      setMembers(data);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to update activity score');
    } finally {
      setSavingMemberId(null);
    }
  }

  function handleNewMemberChange(field, value) {
    setNewMember((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateMember(event) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setSavingMemberId('new');
    setErrorMessage('');

    try {
      const data = await apiPost('/api/members', newMember);
      setMembers(data);
      setNewMember({
        nickname: '',
        job_slug: defaultJobs[0].slug,
        position: 'Member',
        status: 'active',
      });
      setShowAddMemberForm(false);
      setActiveStatusFilter('all');
      setActivePositionFilter('all');
      setMemberSearch('');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to add member');
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleDeleteMember(member) {
    if (!canManage || savingMemberId) {
      return;
    }

    const confirmed = window.confirm(`Delete ${member.nickname}? This also clears lineup and attendance links.`);

    if (!confirmed) {
      return;
    }

    setSavingMemberId(member.id);
    setErrorMessage('');

    try {
      const data = await apiDelete(`/api/members/${member.id}`);
      setMembers(data);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete member');
    } finally {
      setSavingMemberId(null);
    }
  }

  return (
    <div className="page-content">
      <PageHeader eyebrow="Member Management" title="Roster Matrix">
        <div className="header-actions">
          {canManage && (
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowAddMemberForm((current) => !current)}
            >
              <Icon name="plus" />
              {showAddMemberForm ? 'Close Add' : 'Add Member'}
            </button>
          )}
          <ProfileChip activeRole={activeRole} roles={roles} />
        </div>
      </PageHeader>

      <AdminNotice canManage={canManage} action="edit member status" />

      {errorMessage && (
        <div className="alert-card">Member service: {errorMessage}</div>
      )}

      {canManage && showAddMemberForm && (
        <section className="panel member-create-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Manual recruit</p>
              <h3>Add Member</h3>
              <span>Create a roster entry directly in Firestore.</span>
            </div>
          </div>

          <form className="member-form" onSubmit={handleCreateMember}>
            <label>
              <span>Nickname</span>
              <input
                value={newMember.nickname}
                onChange={(event) => handleNewMemberChange('nickname', event.target.value)}
                placeholder="Member nickname"
                disabled={savingMemberId === 'new'}
                required
              />
            </label>

            <label>
              <span>Job</span>
              <select
                value={newMember.job_slug}
                onChange={(event) => handleNewMemberChange('job_slug', event.target.value)}
                disabled={savingMemberId === 'new'}
              >
                {defaultJobs.map((job) => (
                  <option key={job.slug} value={job.slug}>
                    {job.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Position</span>
              <select
                value={newMember.position}
                onChange={(event) => handleNewMemberChange('position', event.target.value)}
                disabled={savingMemberId === 'new'}
              >
                {memberPositions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={newMember.status}
                onChange={(event) => handleNewMemberChange('status', event.target.value)}
                disabled={savingMemberId === 'new'}
              >
                {memberStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={savingMemberId === 'new'}
            >
              <Icon name="plus" />
              {savingMemberId === 'new' ? 'Adding Member' : 'Save Member'}
            </button>
          </form>
        </section>
      )}

      <div className="status-grid">
        {statusSummary.map((status) => (
          <button
            className={[
              'status-card',
              `status-card-${status.value}`,
              activeStatusFilter === status.value ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={status.value}
            type="button"
            onClick={() => setActiveStatusFilter(status.value)}
          >
            <span>{status.label}</span>
            <strong>{status.count}</strong>
          </button>
        ))}
      </div>

      <div className="member-filter-toolbar">
        <label className="member-search">
          <span>Search</span>
          <input
            type="search"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            placeholder="Search nickname, job, status, or position"
          />
        </label>

        <div className="position-filter-group" aria-label="Position filters">
          <span>Position</span>
          <button
            className={`filter-chip ${activePositionFilter === 'all' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActivePositionFilter('all')}
          >
            All
          </button>
          {memberPositionFilters.map((position) => (
            <button
              className={`filter-chip ${activePositionFilter === position ? 'is-active' : ''}`}
              key={position}
              type="button"
              onClick={() => setActivePositionFilter(position)}
            >
              {position}
            </button>
          ))}
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Guild identity</p>
            <h3>Member List</h3>
            <span>
              {displayedMembers.length} shown, sorted by activity score then position.
            </span>
          </div>
        </div>

        {loading ? (
          <EmptyState
            title="Loading members"
            description="Reading roster data from the backend."
          />
        ) : members.length === 0 ? (
          <EmptyState
            title="No members found"
            description="The roster is empty for the selected data provider."
          />
        ) : displayedMembers.length === 0 ? (
          <EmptyState
            title="No members match"
            description="Change the search text, status filter, or position filter."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Position</th>
                  <th className="text-right">Activity Score</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {displayedMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="nickname-cell">{member.nickname}</td>
                    <td>
                      {canManage ? (
                        <select
                          className="status-select member-job-select"
                          value={member.job_slug || ''}
                          onChange={(event) =>
                            handleMemberUpdate(
                              member.id,
                              { job_slug: event.target.value },
                              'Unable to update member job',
                            )
                          }
                          disabled={savingMemberId === member.id}
                        >
                          {defaultJobs.map((job) => (
                            <option key={job.slug} value={job.slug}>
                              {job.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <JobBadge name={member.job_name} slug={member.job_slug} />
                      )}
                    </td>
                    <td>
                      {canManage ? (
                        <select
                          className="status-select"
                          value={member.status || 'active'}
                          onChange={(event) =>
                            handleMemberUpdate(
                              member.id,
                              { status: event.target.value },
                              'Unable to update member status',
                            )
                          }
                          disabled={savingMemberId === member.id}
                        >
                          {memberStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={member.status} />
                      )}
                    </td>
                    <td>
                      {canManage ? (
                        <select
                          className="status-select member-position-input"
                          value={normalizePosition(member.position)}
                          disabled={savingMemberId === member.id}
                          onChange={(event) =>
                            handleMemberUpdate(
                              member.id,
                              { position: event.target.value },
                              'Unable to update member position',
                            )
                          }
                        >
                          {memberPositions.map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      ) : (
                        normalizePosition(member.position)
                      )}
                    </td>
                    <td className="text-right score-cell">
                      {canManage ? (
                        <div className="score-stepper">
                          <button
                            className="score-step-button"
                            type="button"
                            aria-label={`Decrease ${member.nickname} activity score`}
                            disabled={savingMemberId === member.id || Number(member.activity_score || 0) <= 0}
                            onClick={() => handleActivityScoreChange(member.id, -1)}
                          >
                            -
                          </button>
                          <strong>{member.activity_score}</strong>
                          <button
                            className="score-step-button"
                            type="button"
                            aria-label={`Increase ${member.nickname} activity score`}
                            disabled={savingMemberId === member.id}
                            onClick={() => handleActivityScoreChange(member.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        member.activity_score
                      )}
                    </td>
                    {canManage && (
                      <td>
                        <div className="action-cell">
                          <button
                            className="danger-button table-action-button"
                            type="button"
                            disabled={savingMemberId === member.id}
                            onClick={() => handleDeleteMember(member)}
                          >
                            <Icon name="trash" />
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function LineupPage({ canManage, activeRole, roles }) {
  const [lineups, setLineups] = useState({
    teams: [],
    availableMembers: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingSlot, setSavingSlot] = useState('');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const rosterListRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLineups() {
      try {
        const data = await apiGet('/api/lineups');

        if (isMounted) {
          setLineups(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Lineup data is not reachable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLineups();

    return () => {
      isMounted = false;
    };
  }, []);

  const flatSlots = useMemo(() => {
    return lineups.teams.flatMap((team) => team.slots);
  }, [lineups.teams]);

  const defaultSlotKey = useMemo(() => {
    const firstOpenSlot = flatSlots.find((slot) => !slot.member_id) || flatSlots[0];

    if (!firstOpenSlot) {
      return '';
    }

    return getSlotKey(firstOpenSlot);
  }, [flatSlots]);

  const activeSelectedSlotKey = selectedSlotKey || defaultSlotKey;

  const memberOptions = useMemo(() => {
    const lookup = new Map();

    lineups.availableMembers.forEach((member) => {
      lookup.set(String(member.id), member);
    });

    lineups.teams.forEach((team) => {
      team.slots.forEach((slot) => {
        if (slot.member) {
          lookup.set(String(slot.member.id), slot.member);
        }
      });
    });

    return Array.from(lookup.values()).sort((first, second) => {
      const firstPosition = getPositionRank(first.position);
      const secondPosition = getPositionRank(second.position);

      if (firstPosition !== secondPosition) {
        return firstPosition - secondPosition;
      }

      const firstActive = (first.status || 'active') === 'active' ? 0 : 1;
      const secondActive = (second.status || 'active') === 'active' ? 0 : 1;

      if (firstActive !== secondActive) {
        return firstActive - secondActive;
      }

      return String(first.nickname).localeCompare(String(second.nickname));
    });
  }, [lineups]);

  const assignedLocations = useMemo(() => {
    const locations = new Map();

    flatSlots.forEach((slot) => {
      if (!slot.member_id) {
        return;
      }

      locations.set(String(slot.member_id), {
        key: getSlotKey(slot),
        label: `P${slot.team_number} / S${slot.slot_number}`,
      });
    });

    return locations;
  }, [flatSlots]);

  const visibleMemberOptions = useMemo(() => {
    const search = rosterSearch.trim().toLowerCase();
    const filteredMembers = search
      ? memberOptions.filter((member) => {
          return [
            member.nickname,
            member.job_name,
            member.position,
            getStatusLabel(member.status),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search));
        })
      : memberOptions;

    return [...filteredMembers].sort((first, second) => {
      const firstAssigned = assignedLocations.has(String(first.id)) ? 1 : 0;
      const secondAssigned = assignedLocations.has(String(second.id)) ? 1 : 0;

      if (firstAssigned !== secondAssigned) {
        return firstAssigned - secondAssigned;
      }

      return 0;
    });
  }, [assignedLocations, memberOptions, rosterSearch]);

  const selectedSlot = useMemo(() => {
    return (
      flatSlots.find((slot) => {
        return `${slot.team_number}-${slot.slot_number}` === activeSelectedSlotKey;
      }) || null
    );
  }, [activeSelectedSlotKey, flatSlots]);

  const assignedCount = useMemo(() => {
    return lineups.teams.reduce((total, team) => {
      return total + team.slots.filter((slot) => slot.member_id).length;
    }, 0);
  }, [lineups]);

  async function handleSlotChange(teamNumber, slotNumber, memberId) {
    if (!canManage) {
      return;
    }

    const slotKey = `${teamNumber}-${slotNumber}`;
    setSavingSlot(slotKey);
    setErrorMessage('');

    try {
      const data = await apiPut(`/api/lineups/${teamNumber}/${slotNumber}`, {
        member_id: memberId || null,
      });
      setLineups(data);

      if (memberId) {
        setSelectedSlotKey(getNextOpenSlotKey(data.teams, slotKey));
        rosterListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSelectedSlotKey(slotKey);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to update lineup slot');
    } finally {
      setSavingSlot('');
    }
  }

  async function handleAssignSelectedSlot(memberId) {
    if (!selectedSlot) {
      setErrorMessage('Pick a party slot before assigning a member');
      return;
    }

    await handleSlotChange(
      selectedSlot.team_number,
      selectedSlot.slot_number,
      memberId,
    );
  }

  return (
    <div className="page-content">
      <PageHeader eyebrow="Party Assignment" title="Lineup Forge">
        <div className="header-actions">
          <div className="lineup-counter">
            <span>Assigned</span>
            <strong>{assignedCount}/40</strong>
          </div>
          <ProfileChip activeRole={activeRole} roles={roles} />
        </div>
      </PageHeader>

      <AdminNotice canManage={canManage} action="assign party slots" />

      {errorMessage && (
        <div className="alert-card">Lineup service: {errorMessage}</div>
      )}

      {loading ? (
        <section className="panel">
          <EmptyState
            title="Loading lineup"
            description="Reading party slots from the backend."
          />
        </section>
      ) : (
        <div className="lineup-workbench">
          <section className="panel lineup-board-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">8 parties x 5 slots</p>
                <h3>Team Board</h3>
                <span>Click a slot, then choose a member from the roster.</span>
              </div>
            </div>

            <div className="lineup-grid">
              {lineups.teams.map((team) => {
                const filledSlots = team.slots.filter((slot) => slot.member_id).length;
                const isActiveTeam = team.slots.some((slot) => {
                  return getSlotKey(slot) === activeSelectedSlotKey;
                });

                return (
                  <article
                    className={[
                      'lineup-team',
                      isActiveTeam ? 'is-active-party' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={team.team_number}
                  >
                    <div className="lineup-team-header">
                      <div>
                        <span>{isActiveTeam ? 'Active Party' : 'Party'}</span>
                        <strong>{team.team_number}</strong>
                      </div>
                      <p>
                        {isActiveTeam
                          ? `Slot ${selectedSlot?.slot_number || '-'}`
                          : `${filledSlots}/5`}
                      </p>
                    </div>

                    <div className="lineup-slots">
                      {team.slots.map((slot) => {
                        const slotKey = getSlotKey(slot);
                        const isSelected = activeSelectedSlotKey === slotKey;

                        return (
                          <div className="lineup-slot" key={slot.slot_number}>
                            <div
                              className={[
                                'lineup-slot-shell',
                                getLineupJobClass(slot.member),
                                isSelected ? 'is-selected' : '',
                                slot.member ? 'is-filled' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <button
                                className="lineup-slot-button"
                                type="button"
                                onClick={() => setSelectedSlotKey(slotKey)}
                              >
                                <span className="lineup-slot-index">{slot.slot_number}</span>

                                <span className="lineup-slot-main">
                                  <strong>{slot.member?.nickname || 'Empty Slot'}</strong>
                                  <span>
                                    {slot.member?.job_name || 'Awaiting assignment'}
                                  </span>
                                </span>
                              </button>

                              {slot.member && (
                                <button
                                  className="lineup-slot-clear"
                                  type="button"
                                  aria-label={`Clear party ${slot.team_number} slot ${slot.slot_number}`}
                                  title="Clear slot"
                                  disabled={!canManage || Boolean(savingSlot)}
                                  onClick={() =>
                                    handleSlotChange(
                                      slot.team_number,
                                      slot.slot_number,
                                      '',
                                    )
                                  }
                                >
                                  <Icon name="x" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="panel lineup-roster-panel">
            <div className="lineup-roster-header">
              <div>
                <p className="panel-kicker">Job roster</p>
                <h3>Member Roster</h3>
                <span>
                  {selectedSlot
                    ? `Party ${selectedSlot.team_number} / Slot ${selectedSlot.slot_number}`
                    : 'Select a slot'}
                </span>
              </div>
            </div>

            <div
              className={[
                'lineup-selected-slot',
                getLineupJobClass(selectedSlot?.member),
              ].join(' ')}
            >
              <span>Current</span>
              <strong>
                {selectedSlot?.member
                  ? `${selectedSlot.member.nickname} / ${selectedSlot.member.job_name || '-'}`
                  : 'Empty Slot'}
              </strong>
            </div>

            <div className="lineup-roster-search">
              <input
                aria-label="Search roster"
                type="search"
                placeholder="Search nickname or job"
                value={rosterSearch}
                onChange={(event) => setRosterSearch(event.target.value)}
              />
              <span>{visibleMemberOptions.length}/{memberOptions.length}</span>
            </div>

            <div className="lineup-roster-list" ref={rosterListRef}>
              {visibleMemberOptions.length === 0 ? (
                <div className="lineup-roster-empty">
                  No members match the search.
                </div>
              ) : visibleMemberOptions.map((member) => {
                const location = assignedLocations.get(String(member.id));
                const isCurrent =
                  selectedSlot?.member_id &&
                  String(selectedSlot.member_id) === String(member.id);

                return (
                  <button
                    className={[
                      'lineup-roster-member',
                      getLineupJobClass(member),
                      location ? 'is-assigned' : '',
                      isCurrent ? 'is-current' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type="button"
                    key={member.id}
                    disabled={!canManage || !selectedSlot || Boolean(savingSlot)}
                    onClick={() => handleAssignSelectedSlot(member.id)}
                  >
                    <div>
                      <strong>{member.nickname}</strong>
                      <small>{member.job_name || '-'}</small>
                    </div>

                    <span className="lineup-roster-flags">
                      <StatusBadge status={member.status} />
                      <span className={`lineup-location ${isCurrent ? 'is-current' : ''}`}>
                        {isCurrent ? 'Current' : location?.label || 'Free'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function clampPercent(value) {
  return Math.min(96, Math.max(4, value));
}

function readStrategyPins() {
  try {
    const storedPins = JSON.parse(localStorage.getItem(strategyPinsStorageKey));

    if (!Array.isArray(storedPins)) {
      return defaultStrategyPins;
    }

    return defaultStrategyPins.map((defaultPin) => {
      const storedPin = storedPins.find((pin) => {
        return Number(pin.team_number) === defaultPin.team_number;
      });

      if (!storedPin) {
        return defaultPin;
      }

      return {
        team_number: defaultPin.team_number,
        x: clampPercent(Number(storedPin.x) || defaultPin.x),
        y: clampPercent(Number(storedPin.y) || defaultPin.y),
      };
    });
  } catch {
    return defaultStrategyPins;
  }
}

function StrategyPage({ activeRole, roles }) {
  const [lineups, setLineups] = useState({
    teams: [],
    availableMembers: [],
  });
  const [pins, setPins] = useState(readStrategyPins);
  const [draggingTeam, setDraggingTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStrategyLineups() {
      try {
        const data = await apiGet('/api/lineups');

        if (isMounted) {
          setLineups(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Strategy data is not reachable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStrategyLineups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(strategyPinsStorageKey, JSON.stringify(pins));
  }, [pins]);

  const teamLookup = useMemo(() => {
    const lookup = new Map();

    lineups.teams.forEach((team) => {
      lookup.set(Number(team.team_number), team);
    });

    return lookup;
  }, [lineups.teams]);

  function updatePinPosition(teamNumber, clientX, clientY) {
    const mapElement = mapRef.current;

    if (!mapElement) {
      return;
    }

    const rect = mapElement.getBoundingClientRect();
    const x = clampPercent(((clientX - rect.left) / rect.width) * 100);
    const y = clampPercent(((clientY - rect.top) / rect.height) * 100);

    setPins((currentPins) =>
      currentPins.map((pin) => {
        if (pin.team_number !== teamNumber) {
          return pin;
        }

        return {
          ...pin,
          x,
          y,
        };
      }),
    );
  }

  function handlePinPointerDown(event, teamNumber) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingTeam(teamNumber);
    updatePinPosition(teamNumber, event.clientX, event.clientY);
  }

  function handlePinPointerMove(event, teamNumber) {
    if (draggingTeam !== teamNumber) {
      return;
    }

    updatePinPosition(teamNumber, event.clientX, event.clientY);
  }

  function handlePinPointerEnd(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDraggingTeam(null);
  }

  return (
    <div className="page-content">
      <PageHeader eyebrow="War Table" title="Strategy">
        <div className="header-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setPins(defaultStrategyPins)}
          >
            Reset Pins
          </button>
          <ProfileChip activeRole={activeRole} roles={roles} />
        </div>
      </PageHeader>

      {errorMessage && (
        <div className="alert-card">Strategy service: {errorMessage}</div>
      )}

      <section className="panel strategy-panel">
        {loading ? (
          <EmptyState
            title="Loading strategy"
            description="Reading party assignments for the map."
          />
        ) : (
          <div className="strategy-map" ref={mapRef}>
            <img src={strategyMap} alt="Youkai strategy map" draggable="false" />

            {pins.map((pin) => {
              const team = teamLookup.get(pin.team_number);
              const members =
                team?.slots
                  ?.filter((slot) => slot.member)
                  .map((slot) => slot.member) || [];

              return (
                <button
                  className={`strategy-pin strategy-pin-${pin.team_number}`}
                  key={pin.team_number}
                  type="button"
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                  }}
                  onPointerDown={(event) =>
                    handlePinPointerDown(event, pin.team_number)
                  }
                  onPointerMove={(event) =>
                    handlePinPointerMove(event, pin.team_number)
                  }
                  onPointerUp={handlePinPointerEnd}
                  onPointerCancel={handlePinPointerEnd}
                >
                  <span>{pin.team_number}</span>

                  <div className="strategy-tooltip">
                    <strong>Party {pin.team_number}</strong>
                    <small>{members.length}/5 assigned</small>
                    {members.length > 0 ? (
                      <ul>
                        {members.map((member) => (
                          <li key={member.id}>
                            {member.nickname}
                            <span>{member.job_name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Empty party</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EventsPage({ canManage, activeRole, roles }) {
  const [eventsData, setEventsData] = useState({
    eventTypes: [],
    events: [],
  });
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadEventsPage() {
      try {
        const [eventData, memberData] = await Promise.all([
          apiGet('/api/events'),
          apiGet('/api/members'),
        ]);

        if (isMounted) {
          setEventsData(eventData);
          setMembers(memberData);
          setEventTypeId((prev) => prev || String(eventData.eventTypes[0]?.id || ''));
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Event data is not reachable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEventsPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeMembers = useMemo(() => {
    return members.filter((member) => (member.status || 'active') === 'active');
  }, [members]);

  function toggleAttendance(memberId) {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }

      return [...prev, memberId];
    });
  }

  async function handleCreateEvent(event) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const data = await apiPost('/api/events', {
        title,
        event_type_id: Number(eventTypeId),
        event_date: eventDate,
        note,
        member_ids: selectedMemberIds,
      });

      setEventsData(data);
      setTitle('');
      setNote('');
      setSelectedMemberIds([]);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!canManage) {
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const data = await apiDelete(`/api/events/${eventId}`);
      setEventsData(data);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete event');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader eyebrow="Activity Input" title="Campaign Ledger">
        <div className="header-actions">
          <button
            className="primary-button"
            type="submit"
            form="event-create-form"
            disabled={!canManage || saving}
          >
            <Icon name="plus" />
            {saving ? 'Saving Event' : 'Create Event'}
          </button>
          <ProfileChip activeRole={activeRole} roles={roles} />
        </div>
      </PageHeader>

      <AdminNotice canManage={canManage} action="create or delete events" />

      {errorMessage && (
        <div className="alert-card">Event service: {errorMessage}</div>
      )}

      {loading ? (
        <section className="panel">
          <EmptyState
            title="Loading events"
            description="Reading event records and member checklist."
          />
        </section>
      ) : (
        <div className="panel-grid event-workspace">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Battle modes</p>
                <h3>Create Event</h3>
                <span>Record an event and checklist attending active members.</span>
              </div>
            </div>

            <form id="event-create-form" className="event-form" onSubmit={handleCreateEvent}>
              <label>
                <span>Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Guild League round 1"
                  disabled={!canManage || saving}
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  <span>Type</span>
                  <select
                    value={eventTypeId}
                    onChange={(event) => setEventTypeId(event.target.value)}
                    disabled={!canManage || saving}
                    required
                  >
                    {eventsData.eventTypes.map((eventType) => (
                      <option key={eventType.id} value={eventType.id}>
                        {eventType.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                    disabled={!canManage || saving}
                  />
                </label>
              </div>

              <label>
                <span>Note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional callout, result, or reminder"
                  disabled={!canManage || saving}
                />
              </label>

              <div className="checklist-header">
                <div>
                  <strong>Attendance</strong>
                  <span>{selectedMemberIds.length} selected</span>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={!canManage || saving}
                  onClick={() => setSelectedMemberIds(activeMembers.map((member) => member.id))}
                >
                  Select Active
                </button>
              </div>

              <div className="attendance-grid">
                {activeMembers.map((member) => (
                  <label className="attendance-check" key={member.id}>
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.id)}
                      disabled={!canManage || saving}
                      onChange={() => toggleAttendance(member.id)}
                    />
                    <span>{member.nickname}</span>
                    <small>{member.job_name}</small>
                  </label>
                ))}
              </div>

              <button className="primary-button" type="submit" disabled={!canManage || saving}>
                <Icon name="plus" />
                {saving ? 'Saving Event' : 'Create Event'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Event archive</p>
                <h3>Recorded Events</h3>
                <span>Attendance count feeds activity score.</span>
              </div>
            </div>

            {eventsData.events.length === 0 ? (
              <EmptyState
                title="No events yet"
                description="Created events will appear here with attendance totals."
              />
            ) : (
              <div className="event-list">
                {eventsData.events.map((event) => (
                  <article className="event-row" key={event.id}>
                    <div>
                      <span>{event.event_type_name}</span>
                      <strong>{event.title}</strong>
                      <p>{event.event_date}</p>
                    </div>
                    <div className="event-row-actions">
                      <b>{event.attendance_count || 0}</b>
                      <button
                        className="danger-button"
                        type="button"
                        disabled={!canManage || saving}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Icon name="trash" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function JobsPage({ activeRole, roles }) {
  return (
    <div className="page-content">
      <PageHeader eyebrow="Master Data" title="Class Armory">
        <div className="header-actions">
          <ProfileChip activeRole={activeRole} roles={roles} />
        </div>
      </PageHeader>

      <section className="panel">
        <div className="job-grid">
          {defaultJobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-icon">{jobMarks[job.slug] || '--'}</div>

              <div>
                <h3>{job.name}</h3>
                <p>{job.order}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Sidebar({
  activePage,
  activeRole,
  authError,
  authLoading,
  authProfile,
  currentUser,
  sidebarCollapsed,
  roles,
  setActivePage,
  setActiveRole,
  onToggleSidebar,
  onSignIn,
  onSignOut,
}) {
  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand-row">
        <div className="brand">
          <div className="brand-logo">
            <Icon name="shield" />
          </div>

          <div className="brand-copy">
            <h2>Youkai</h2>
            <p>Guild Control</p>
          </div>
        </div>

        <button
          className="sidebar-toggle"
          type="button"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
          <Icon name={sidebarCollapsed ? 'chevronRight' : 'chevronLeft'} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={activePage === item.key ? 'active' : ''}
            onClick={() => setActivePage(item.key)}
            title={item.label}
            type="button"
          >
            <Icon name={item.icon} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-panel">
        <div className="sidebar-panel-title">
          <Icon name="signal" />
          Access Rune
        </div>
        {hasFirebaseConfig ? (
          <AuthPanel
            activeRole={activeRole}
            authError={authError}
            authLoading={authLoading}
            authProfile={authProfile}
            currentUser={currentUser}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        ) : (
          <RoleSwitch
            activeRole={activeRole}
            roles={roles}
            onChange={setActiveRole}
          />
        )}
      </div>

      <div className="sidebar-footer">
        <p>Provider</p>
        <strong>Firestore ready</strong>
      </div>
    </aside>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeRole, setActiveRole] = useState(hasFirebaseConfig ? 'user' : 'admin');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authProfile, setAuthProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [roles, setRoles] = useState(fallbackRoles);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      try {
        const data = await apiGet('/api/roles');

        if (isMounted && Array.isArray(data) && data.length > 0) {
          setRoles(data);
        }
      } catch {
        if (isMounted) {
          setRoles(fallbackRoles);
        }
      }
    }

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig || !firebaseAuth) {
      return undefined;
    }

    return onAuthStateChanged(firebaseAuth, async (user) => {
      setCurrentUser(user);
      setAuthError('');

      if (!user) {
        setAuthProfile(null);
        setActiveRole('user');
        return;
      }

      setAuthLoading(true);

      try {
        const profile = await apiGet('/api/auth/me');
        setAuthProfile(profile);
        setActiveRole(profile?.role || 'user');
      } catch (error) {
        setAuthProfile(null);
        setActiveRole('user');
        setAuthError(error.message || 'Unable to verify Firebase role');
      } finally {
        setAuthLoading(false);
      }
    });
  }, []);

  async function handleSignIn(email, password) {
    if (!firebaseAuth) {
      setAuthError('Firebase is not configured');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in');
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    if (!firebaseAuth) {
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      await signOut(firebaseAuth);
      setAuthProfile(null);
      setActiveRole('user');
    } catch (error) {
      setAuthError(error.message || 'Unable to sign out');
    } finally {
      setAuthLoading(false);
    }
  }

  const canManage = useMemo(() => activeRole === 'admin', [activeRole]);

  return (
    <main className="app-shell">
      <Sidebar
        activePage={activePage}
        activeRole={activeRole}
        authError={authError}
        authLoading={authLoading}
        authProfile={authProfile}
        currentUser={currentUser}
        sidebarCollapsed={sidebarCollapsed}
        roles={roles}
        setActivePage={setActivePage}
        setActiveRole={setActiveRole}
        onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <section className="main-section">
        {activePage === 'dashboard' && (
          <DashboardPage activeRole={activeRole} roles={roles} />
        )}
        {activePage === 'members' && (
          <MembersPage
            activeRole={activeRole}
            roles={roles}
            canManage={canManage}
          />
        )}
        {activePage === 'events' && (
          <EventsPage
            activeRole={activeRole}
            roles={roles}
            canManage={canManage}
          />
        )}
        {activePage === 'lineups' && (
          <LineupPage
            activeRole={activeRole}
            roles={roles}
            canManage={canManage}
          />
        )}
        {activePage === 'strategy' && (
          <StrategyPage activeRole={activeRole} roles={roles} />
        )}
        {activePage === 'jobs' && (
          <JobsPage
            activeRole={activeRole}
            roles={roles}
            canManage={canManage}
          />
        )}
      </section>
    </main>
  );
}
