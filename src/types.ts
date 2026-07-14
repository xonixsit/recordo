export interface Chapter {
  time: string;
  title: string;
  description: string;
}

export interface BugReport {
  title: string;
  description: string;
  reproductionSteps: string[];
  expectedResult: string;
  actualResult: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SOP {
  title: string;
  content: string;
  steps: string[];
  category: string;
}

export interface RepurposedContent {
  linkedIn: string;
  twitterThread: string[];
  blogArticle: string;
  newsletter: string;
}

export interface ProposalAssistant {
  proposal: string;
  pricing: string;
  timeline: string;
  contract: string;
}

export interface InvoiceAssistant {
  description: string;
  timeSummary: string;
  amount: string;
  billingNotes: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  company: string;
  project: string;
  email: string;
  preferences: string[];
  brandColors: {
    primary: string;
    secondary: string;
  };
  writingStyle: string;
  billingRate: string;
  recordingIds: string[];
}

export interface Recording {
  id: string;
  title: string;
  duration: string;
  createdAt: string;
  transcript: string;
  clientName: string;
  clientCompany: string;
  project: string;
  thumbnailUrl: string;
  videoUrl?: string;
  videoSize?: string;
  resolution?: string;
  mimeType?: string;
  isRealScreen?: boolean;
  
  // AI Generated Communication
  summary?: string;
  executiveSummary: string;
  clientExplanation: string;
  technicalExplanation: string;
  nonTechnicalExplanation: string;
  highlights: string[];
  chapters: Chapter[];
  
  // AI Generated Business Automation
  followUpEmail: string;
  proposalDraft: string;
  meetingMinutes: string;
  scopeDoc: string;
  actionItems: string[];
  
  // Optional Specialized AI Artifacts
  bugReport: BugReport | null;
  sop: SOP | null;
  repurposedContent: RepurposedContent | null;
  proposalAssistant: ProposalAssistant | null;
  invoiceAssistant: InvoiceAssistant | null;

  // Gated premium attributes
  isPremiumGated?: boolean;
  price?: number;
  buyers?: string[]; // buyer emails
}

export interface KnowledgeAnswer {
  answer: string;
  relevantRecordings: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
}

export interface SystemIntegration {
  id: string;
  name: string;
  category: 'storage' | 'workspace' | 'dev' | 'sales' | 'communication';
  icon: string;
  connected: boolean;
  syncStatus?: 'synced' | 'failed' | 'idle';
  lastSync?: string;
}
