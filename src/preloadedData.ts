import { Recording, ClientProfile, SystemIntegration } from './types';

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'client-1',
    name: 'Sarah Connor',
    company: 'Cyberdyne Systems',
    project: 'T-800 UI Rebuild',
    email: 'sarah@cyberdyne.com',
    preferences: ['Prefers brief bulleted email updates', 'High priority on responsive mobile layouts', 'Uses Stripe for client billing'],
    brandColors: {
      primary: '#0f172a',
      secondary: '#10b981'
    },
    writingStyle: 'Direct, professional, urgency-driven',
    billingRate: '$250/hr',
    recordingIds: ['rec-1']
  },
  {
    id: 'client-2',
    name: 'Marcus Wright',
    company: 'Project Angel Inc',
    project: 'E-commerce Checkout GST',
    email: 'marcus.wright@angel.co',
    preferences: ['Demands detailed API documentation', 'Prefers Slack communication over email', 'Wants fixed-price milestone structures'],
    brandColors: {
      primary: '#3b82f6',
      secondary: '#f59e0b'
    },
    writingStyle: 'Technical, systematic, collaborative',
    billingRate: '$180/hr',
    recordingIds: ['rec-2']
  },
  {
    id: 'client-3',
    name: 'John Connor',
    company: 'Resistance Media',
    project: 'SaaS Launch Strategy',
    email: 'john@resistance.net',
    preferences: ['Prefers YouTube content layouts', 'Needs quick 1-minute summaries', 'Wants LinkedIn copy pre-generated'],
    brandColors: {
      primary: '#dc2626',
      secondary: '#4f46e5'
    },
    writingStyle: 'Inspiring, visionary, action-oriented',
    billingRate: '$300/hr',
    recordingIds: ['rec-3']
  }
];

export const INITIAL_INTEGRATIONS: SystemIntegration[] = [
  { id: 'google-drive', name: 'Google Drive', category: 'storage', icon: 'HardDrive', connected: true, syncStatus: 'synced', lastSync: '10 mins ago' },
  { id: 'notion', name: 'Notion', category: 'workspace', icon: 'BookOpen', connected: true, syncStatus: 'synced', lastSync: '1 hr ago' },
  { id: 'slack', name: 'Slack', category: 'communication', icon: 'MessageSquare', connected: false, syncStatus: 'idle' },
  { id: 'github', name: 'GitHub', category: 'dev', icon: 'Github', connected: true, syncStatus: 'synced', lastSync: '5 mins ago' },
  { id: 'jira', name: 'Jira', category: 'dev', icon: 'FolderOpen', connected: false, syncStatus: 'idle' },
  { id: 'gmail', name: 'Gmail', category: 'communication', icon: 'Mail', connected: true, syncStatus: 'synced', lastSync: 'Just now' },
  { id: 'stripe', name: 'Stripe Payments', category: 'sales', icon: 'CreditCard', connected: true, syncStatus: 'synced', lastSync: '4 hrs ago' }
];

export const INITIAL_RECORDINGS: Recording[] = [];
