const defaultRoles = [
  {
    id: 'admin',
    name: 'Admin',
    tone: 'Command',
    permissions: ['manage_members', 'manage_events', 'manage_roles', 'view_dashboard'],
  },
  {
    id: 'user',
    name: 'User',
    tone: 'Scout',
    permissions: ['view_dashboard', 'view_members'],
  },
];

const defaultUsers = [
  {
    id: 'admin',
    displayName: 'Guild Administrator',
    email: 'admin@youkai.local',
    role: 'admin',
    isActive: true,
  },
  {
    id: 'user',
    displayName: 'Guild Member',
    email: 'user@youkai.local',
    role: 'user',
    isActive: true,
  },
];

const defaultJobs = [
  { id: 1, name: 'Lord Knight', slug: 'lord-knight', icon: 'lord-knight' },
  { id: 2, name: 'Assassin', slug: 'assassin', icon: 'assassin' },
  { id: 3, name: 'Stalker', slug: 'stalker', icon: 'stalker' },
  { id: 4, name: 'Minstrel', slug: 'minstrel', icon: 'minstrel' },
  { id: 5, name: 'Gypsy', slug: 'gypsy', icon: 'gypsy' },
  { id: 6, name: 'Paladin', slug: 'paladin', icon: 'paladin' },
  { id: 7, name: 'Biochemist', slug: 'biochemist', icon: 'biochemist' },
  { id: 8, name: 'Professor', slug: 'professor', icon: 'professor' },
  { id: 9, name: 'High Wizard', slug: 'high-wizard', icon: 'high-wizard' },
  { id: 10, name: 'Whitesmith', slug: 'whitesmith', icon: 'whitesmith' },
  { id: 11, name: 'High Priest', slug: 'high-priest', icon: 'high-priest' },
  { id: 12, name: 'Doram', slug: 'doram', icon: 'doram' },
  { id: 13, name: 'Sniper', slug: 'sniper', icon: 'sniper' },
  { id: 14, name: 'Monk', slug: 'monk', icon: 'monk' },
];

const defaultEventTypes = [
  { id: 1, name: 'Guild League', slug: 'guild-league', is_active: true },
  { id: 2, name: 'Emperium Overrun', slug: 'emperium-overrun', is_active: true },
];

module.exports = {
  defaultEventTypes,
  defaultJobs,
  defaultRoles,
  defaultUsers,
};
