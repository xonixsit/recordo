import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Video, Mic, Sparkles, Search, MessageSquare, Mail, Users, FileText,
  Settings, HelpCircle, HardDrive, BookOpen, CreditCard, Plus, CheckCircle,
  AlertTriangle, Cpu, TrendingUp, DollarSign, ExternalLink, Share2, Copy, Download,
  Check, Filter, Bug, Clock, Send, Lock, Book, FileSpreadsheet, FileQuestion,
  Megaphone, Receipt, RefreshCw, BarChart2, ShieldCheck, Star, Trash2, VideoOff, MicOff
} from 'lucide-react';

import { Recording, ClientProfile, SystemIntegration, Chapter, BugReport, SOP, RepurposedContent, ProposalAssistant, InvoiceAssistant } from './types';
import { INITIAL_CLIENTS, INITIAL_INTEGRATIONS, INITIAL_RECORDINGS } from './preloadedData';

// Simple helper to render beautiful styled markdown
function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return <span className="text-slate-400">No content generated yet.</span>;

  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="text-base font-bold text-slate-100 mt-4 mb-2 flex items-center gap-2 border-b border-slate-800 pb-1">{trimmed.replace('### ', '')}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="text-lg font-bold text-emerald-400 mt-5 mb-2 flex items-center gap-2">{trimmed.replace('## ', '')}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} className="text-xl font-black text-white mt-6 mb-3 tracking-tight">{trimmed.replace('# ', '')}</h2>;
        }
        
        // Bold tags
        let content = trimmed;
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="text-emerald-300 font-semibold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < content.length) {
          parts.push(content.substring(lastIndex));
        }

        // List Item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="list-none pl-5 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-500 my-1">
              {parts.length > 0 ? parts : trimmed.substring(2)}
            </li>
          );
        }
        
        // Checklist/Numbered item
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+\.\s)(.*)/);
          return (
            <div key={idx} className="pl-6 relative my-1">
              <span className="absolute left-1 text-emerald-400 font-mono text-xs font-semibold">{numMatch ? numMatch[1] : ''}</span>
              {parts.length > 0 ? parts : (numMatch ? numMatch[2] : trimmed)}
            </div>
          );
        }

        // Code block / Key-value
        if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
          return (
            <code key={idx} className="block bg-slate-950 px-3 py-2 rounded-md font-mono text-xs text-amber-300 border border-slate-800 my-2 overflow-x-auto">
              {trimmed.replace(/`/g, '')}
            </code>
          );
        }

        // Empty line
        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        return <p key={idx}>{parts.length > 0 ? parts : line}</p>;
      })}
    </div>
  );
}

export default function App() {
  // Navigation tabs: 'recordings' | 'memory' | 'crm' | 'revenue' | 'analytics'
  const [activeTab, setActiveTab] = useState<'recordings' | 'memory' | 'crm' | 'revenue' | 'analytics'>('recordings');
  
  // Data States
  const [recordings, setRecordings] = useState<Recording[]>(INITIAL_RECORDINGS);
  const [clients, setClients] = useState<ClientProfile[]>(INITIAL_CLIENTS);
  const [integrations, setIntegrations] = useState<SystemIntegration[]>(INITIAL_INTEGRATIONS);
  
  // Selection
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>(INITIAL_RECORDINGS[0]?.id || '');
  const selectedRecording = recordings.find(r => r.id === selectedRecordingId) || recordings[0] || null;
  
  // Sub-tabs in Recording Detail Workspace
  const [detailTab, setDetailTab] = useState<'summary' | 'business' | 'sop' | 'repurpose' | 'financials' | 'bug' | 'chat'>('summary');
  
  // Sandbox Recorder Simulator States
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [sandboxTitle, setSandboxTitle] = useState('New Project Brief Review');
  const [sandboxClient, setSandboxClient] = useState(INITIAL_CLIENTS[0].name);
  const [sandboxProject, setSandboxProject] = useState(INITIAL_CLIENTS[0].project);
  const [sandboxTranscript, setSandboxTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  // Media Capture States
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real Screen Recorder States & Refs
  const [isRealRecording, setIsRealRecording] = useState(false);
  const [realRecordUrl, setRealRecordUrl] = useState<string | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Global Knowledge Chat States
  const [globalQuestion, setGlobalQuestion] = useState('');
  const [globalAnswer, setGlobalAnswer] = useState<string>('');
  const [globalSources, setGlobalSources] = useState<Array<{id: string, title: string, reason: string}>>([]);
  const [isQueryingKB, setIsQueryingKB] = useState(false);

  // Recording Chatbot States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: 'Hi there! I have parsed this video walkthrough. Ask me to generate emails, checklists, write documentation, or explain components mentioned in the recording.' }
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Filter for Recording Hub list
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'bugs' | 'sop' | 'client'>('all');

  // Copy state helper
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Client profile form
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientProject, setNewClientProject] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Revenue Slider Price and gated checklist
  const [gatedRecordings, setGatedRecordings] = useState<Record<string, { price: number, active: boolean }>>({
    'rec-1': { price: 49, active: false },
    'rec-2': { price: 99, active: true },
    'rec-3': { price: 29, active: false }
  });

  // Action Items local checklist checked state
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // Share and Viewer Mode States
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [viewerRecordingId, setViewerRecordingId] = useState<string | null>(null);
  const [viewerRecording, setViewerRecording] = useState<Recording | null>(null);
  const [viewerComments, setViewerComments] = useState<any[]>([]);
  const [viewerEmojis, setViewerEmojis] = useState<any>({ thumbsup: 0, clap: 0, heart: 0, rocket: 0, party: 0 });
  const [viewerVideoData, setViewerVideoData] = useState<string | null>(null);
  const [isViewerApproved, setIsViewerApproved] = useState(false);
  const [viewerApprovedBy, setViewerApprovedBy] = useState('');
  const [isUploadingShare, setIsUploadingShare] = useState(false);
  const [sharedLinkUrl, setSharedLinkUrl] = useState<string | null>(null);
  const [showShareSuccessModal, setShowShareSuccessModal] = useState(false);

  // Trigger copy indicator
  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Preset Sandbox Templates for rapid product demonstration
  const SANDBOX_TEMPLATES = [
    {
      id: 'template-bug',
      name: '🐛 [Bug Report] Absolute drop-down menu overlap',
      client: 'Sarah Connor',
      company: 'Cyberdyne Systems',
      project: 'T-800 UI Rebuild',
      title: 'T-800 Mobile Navigation Collapse Error',
      transcript: 'Hey Sarah, showing you the absolute positioning dropdown menu on the mobile build. The issue is that below 640px viewport widths, clicking the header menu button throws the items drawer directly on top of the Cyberdyne logotype container. Because the z-index on the header wrapper was never defined, the branding layers bleed through and block standard touch targets. We should adjust this dropdown layout to top-16 and add clean relative spacing offsets so mobile users can exit easily. Also, please confirm we are charging the requested $99 per month fee structure.'
    },
    {
      id: 'template-sop',
      name: '📖 [SOP Tutorial] GST checkout database fields',
      client: 'Marcus Wright',
      company: 'Project Angel Inc',
      project: 'E-commerce Checkout GST',
      title: 'Guide: Configuring Province-Level GST Rules',
      transcript: 'Hello Marcus, this is a walkthrough of our newly implemented sales tax tiering matrix. For Ontario customers, GST calculates automatically at thirteen percent. For other provinces, we fall back to general database values. We added database variables like payment_id, client_id, and gst_tax_applied to log each transaction. I will construct a comprehensive standard operating procedure so your engineers can deploy this migrations file immediately.'
    },
    {
      id: 'template-client',
      name: '🚀 [Launch Call] SaaS Strategy & Dark Aesthetics',
      client: 'John Connor',
      company: 'Resistance Media',
      project: 'SaaS Launch Strategy',
      title: 'Resistance Media Campaign and Launch Alignment',
      transcript: 'Hi John, let us establish the soft launch timeline scheduled for early next month. First, we plan to repurpose all video reviews into engaging LinkedIn slides and Twitter threads to build public momentum. Second, John emphasized their strong preference for deep dark-mode backgrounds, pure black design layers, and elegant emerald gradients. We have recorded these preferences directly in our AI Workspace memory database to drive our UI generations.'
    }
  ];

  // Handle template selection
  const selectSandboxTemplate = (id: string) => {
    setSelectedTemplate(id);
    const template = SANDBOX_TEMPLATES.find(t => t.id === id);
    if (template) {
      setSandboxTitle(template.title);
      setSandboxClient(template.client);
      setSandboxProject(`${template.company} - ${template.project}`);
      setSandboxTranscript(template.transcript);
    } else {
      setSandboxTitle('New Video Walkthrough');
      setSandboxTranscript('');
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
        setCameraStream(stream);
        setIsCameraOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not access camera (expected in sandbox iFrames):", err);
        setIsCameraOn(true); // Mock camera animation fallback in UI
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  // Start/Stop recording simulator timer
  const toggleRecordingActive = () => {
    if (isRecordingActive) {
      if (isRealRecording) {
        stopRealScreenRecording();
      } else {
        setIsRecordingActive(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        // Simulate typing up a spoken transcript
        if (!sandboxTranscript.trim()) {
          setSandboxTranscript(`This is a mock recorded transcription. We walked through the client's current project objectives, solved a navigation alignment layout bug in CSS, and mapped out next week's deliverables. Client is ready to kick off immediately at our proposed retainer.`);
        }
      }
    } else {
      setIsRecordingActive(true);
      setIsRealRecording(false);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  // Start Real screen share / recording with audio/mic Web Speech API
  const startRealScreenRecording = async () => {
    try {
      setRecorderError(null);
      recordedChunksRef.current = [];
      setRealRecordUrl(null);
      setRecordedBlob(null);
      
      // Attempt display media capture (tab selection dialogue)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        },
        audio: true
      });
      
      screenStreamRef.current = stream;
      setIsRealRecording(true);
      setIsRecordingActive(true);
      setRecordingSeconds(0);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Configure MediaRecorder for high fidelity
      let options = { mimeType: 'video/webm; codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/mp4' };
      }
      
      try {
        const recorder = new MediaRecorder(stream, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRealRecordUrl(url);
          setRecordedBlob(blob);
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start(1000);
      } catch (recErr) {
        console.warn("MediaRecorder creation error:", recErr);
      }
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      
      // Auto enable speech recognition if mic is active
      if (isMicOn && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Speech recognition busy or failing to start:", e);
        }
      }
      
      // Detect when native browser stop sharing ribbon is pressed
      stream.getVideoTracks()[0].onended = () => {
        stopRealScreenRecording();
      };
      
    } catch (err: any) {
      console.error("Failed to share display screen:", err);
      setRecorderError(
        err?.message || "Screen capture stream could not be initialized. Browser iframe sandboxing has restricted recording."
      );
    }
  };

  // Stop Real recording
  const stopRealScreenRecording = () => {
    setIsRecordingActive(false);
    setIsRealRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn(err);
      }
    }
    
    if (isCameraOn && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Auto populate realistic title and transcript if currently empty
    setSandboxTranscript(prev => {
      if (!prev || !prev.trim()) {
        return `This screen walkthrough was recorded on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}. We walked through the main application layout, inspected the user interface responsiveness across multiple viewport sizes, checked the connected system integration sync statuses, and resolved the main container alignment bugs. Everything is ready for client review and final sign-off.`;
      }
      return prev;
    });

    setSandboxTitle(prev => {
      if (!prev || prev === 'New Project Brief Review' || !prev.trim()) {
        return `Walkthrough: ${sandboxProject || 'Project Update'} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      return prev;
    });
  };

  // Initialize speech recognition on mount if browser supports it
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setSandboxTranscript(prev => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };
      
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Submit and process new recording via Server API
  const handleProcessRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxTranscript.trim()) return;

    setIsProcessing(true);
    try {
      // Find matching client
      const matchedClient = clients.find(c => c.name.toLowerCase().includes(sandboxClient.toLowerCase())) || clients[0];

      const response = await fetch('/api/process-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sandboxTitle,
          transcript: sandboxTranscript,
          clientName: matchedClient.name,
          clientCompany: matchedClient.company,
          project: matchedClient.project
        }),
      });

      if (!response.ok) {
        throw new Error('Server request failed');
      }

      const aiData = await response.json();
      
      const newRec: Recording = {
        id: `rec-${Date.now()}`,
        title: sandboxTitle,
        duration: recordingSeconds > 0 ? formatTime(recordingSeconds) : '3:12',
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        transcript: sandboxTranscript,
        clientName: aiData.clientName || matchedClient.name,
        clientCompany: aiData.clientCompany || matchedClient.company,
        project: aiData.project || matchedClient.project,
        thumbnailUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop&q=60',
        videoUrl: realRecordUrl || undefined,
        videoSize: recordedBlob ? `${(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB` : '5.8 MB',
        resolution: screenStreamRef.current ? `${screenStreamRef.current.getVideoTracks()[0]?.getSettings()?.width || window.screen.width}x${screenStreamRef.current.getVideoTracks()[0]?.getSettings()?.height || window.screen.height}` : `${window.screen.width}x${window.screen.height}`,
        mimeType: recordedBlob ? recordedBlob.type : 'video/webm; codecs=vp9',
        isRealScreen: !!realRecordUrl,
        
        summary: aiData.summary,
        executiveSummary: aiData.executiveSummary,
        clientExplanation: aiData.clientExplanation,
        technicalExplanation: aiData.technicalExplanation,
        nonTechnicalExplanation: aiData.nonTechnicalExplanation,
        highlights: aiData.highlights || [],
        chapters: aiData.chapters || [],
        followUpEmail: aiData.followUpEmail,
        proposalDraft: aiData.proposalDraft,
        meetingMinutes: aiData.meetingMinutes,
        scopeDoc: aiData.scopeDoc,
        actionItems: aiData.actionItems || [],
        bugReport: aiData.bugReport,
        sop: aiData.sop,
        repurposedContent: aiData.repurposedContent,
        proposalAssistant: aiData.proposalAssistant,
        invoiceAssistant: aiData.invoiceAssistant
      };

      setRecordings(prev => [newRec, ...prev]);
      setSelectedRecordingId(newRec.id);
      setIsRecordingModalOpen(false);
      
      // Add record to Gated Pricing defaults
      setGatedRecordings(prev => ({
        ...prev,
        [newRec.id]: { price: 49, active: false }
      }));

      // Auto-populate client history recording ID if client exists
      setClients(prev => prev.map(c => {
        if (c.name === newRec.clientName) {
          return { ...c, recordingIds: [...c.recordingIds, newRec.id] };
        }
        return c;
      }));

      // Automatically publish to server and open public client share link modal
      setTimeout(() => {
        handleShareWorkspace(newRec);
      }, 300);

    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setIsRecordingActive(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Ask global knowledge base question
  const askKnowledgeBase = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = customQ || globalQuestion;
    if (!query.trim()) return;

    setIsQueryingKB(true);
    setGlobalQuestion(query);

    try {
      const response = await fetch('/api/knowledge-base/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          recordings: recordings
        })
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      setGlobalAnswer(data.answer);
      setGlobalSources(data.relevantRecordings || []);
    } catch (err) {
      console.error(err);
      setGlobalAnswer("An error occurred querying the business memory system.");
    } finally {
      setIsQueryingKB(false);
    }
  };

  // Ask specific recording chatbot
  const askRecordingChat = async (e?: React.FormEvent, presetPrompt?: string) => {
    if (e) e.preventDefault();
    const prompt = presetPrompt || chatMessage;
    if (!prompt.trim()) return;

    const userMsg = { role: 'user' as const, content: prompt };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/recording/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory.filter(c => c.role !== 'assistant' || c.content.substring(0, 10) !== 'Hi there!'),
          message: prompt,
          transcript: selectedRecording.transcript,
          title: selectedRecording.title
        })
      });

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble processing that question over the video." }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Filter recordings list
  const filteredRecordings = recordings.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          rec.clientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          rec.transcript.toLowerCase().includes(searchFilter.toLowerCase());
    
    if (categoryFilter === 'bugs') return matchesSearch && rec.bugReport;
    if (categoryFilter === 'sop') return matchesSearch && rec.sop;
    if (categoryFilter === 'client') return matchesSearch && rec.clientName;
    return matchesSearch;
  });

  // Add a new client
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientCompany) return;

    const newC: ClientProfile = {
      id: `client-${Date.now()}`,
      name: newClientName,
      company: newClientCompany,
      project: newClientProject || 'General Consulting',
      email: newClientEmail || 'client@example.com',
      preferences: ['Preferred standard follow-ups'],
      brandColors: { primary: '#10b981', secondary: '#06b6d4' },
      writingStyle: 'Professional',
      billingRate: '$150/hr',
      recordingIds: []
    };

    setClients(prev => [...prev, newC]);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientProject('');
    setNewClientEmail('');
  };

  // Toggle Integration Status
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          connected: !item.connected,
          syncStatus: !item.connected ? 'synced' : 'idle',
          lastSync: !item.connected ? 'Just now' : undefined
        };
      }
      return item;
    }));
  };

  // Sync specific integration
  const syncIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          syncStatus: 'synced',
          lastSync: 'Just now'
        };
      }
      return item;
    }));
  };

  // Delete recording
  const handleDeleteRecording = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = recordings.filter(r => r.id !== id);
    setRecordings(remaining);
    if (selectedRecordingId === id) {
      setSelectedRecordingId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  // ScribeBiz Shared Recording & Collaboration Hub Logic
  useEffect(() => {
    // Load existing recordings from server on mount
    const fetchRecordings = async () => {
      try {
        const response = await fetch('/api/recordings');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setRecordings(data);
            setSelectedRecordingId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load server recordings:", err);
      }
    };
    fetchRecordings();

    const params = new URLSearchParams(window.location.search);
    const dId = params.get('demoId');
    if (dId) {
      setIsViewerMode(true);
      setViewerRecordingId(dId);
      fetchSharedSession(dId);
    }
  }, []);

  const fetchSharedSession = async (dId: string) => {
    try {
      const response = await fetch(`/api/shared-recordings/${dId}`);
      if (response.ok) {
        const data = await response.json();
        setViewerComments(data.comments || []);
        setViewerEmojis(data.emojis || { thumbsup: 0, clap: 0, heart: 0, rocket: 0, party: 0 });
        setIsViewerApproved(data.isApproved || false);
        setViewerApprovedBy(data.approvedBy || '');
        if (data.videoData) {
          setViewerVideoData(data.videoData);
        }
        
        // Find matching recording
        if (data.recording) {
          setViewerRecording(data.recording);
        } else {
          // Fallback: match from local initial recordings list
          const localRec = INITIAL_RECORDINGS.find(r => r.id === dId);
          if (localRec) {
            setViewerRecording(localRec);
          } else {
            // Create a general dummy recording
            setViewerRecording({
              id: dId,
              title: "Shared Video Walkthrough",
              duration: "2:45",
              createdAt: "July 14, 2026",
              transcript: "This is a shared presentation brief walkthrough regarding the latest design layouts, bugs fixed, and standard operating procedures for the project client portal review.",
              clientName: "Valued Client",
              clientCompany: "Global Corp",
              project: "General Systems Rebuild",
              thumbnailUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop&q=60",
              summary: "A shared video walkthrough of current milestone layouts and mobile interface adjustments.",
              executiveSummary: "Executive level review of current milestones.",
              clientExplanation: "Hi, this video covers progress on our layout deliverables and next steps.",
              technicalExplanation: "Responsive layout adjustments using flexbox offsets and standard viewport constraints.",
              nonTechnicalExplanation: "Mobile and computer screen reviews to ensure fluid user experiences.",
              highlights: ["walkthrough of core desktop and mobile screens", "approved client pricing and layout specifications"],
              chapters: [
                { time: "0:00", title: "Project Introduction", description: "Demonstrating layouts and overview details" }
              ],
              followUpEmail: "Hi team,\n\nHere is our walkthrough. Let us know if you approve!\n\nBest,\nScribeBiz AI",
              proposalDraft: "SOW review proposal.",
              meetingMinutes: "Meeting mins recorded July 14, 2026.",
              scopeDoc: "Standard scope.",
              actionItems: ["Verify layout scaling on standard viewports", "Sign off and approve the proposal"],
              bugReport: null,
              sop: null,
              repurposedContent: null,
              proposalAssistant: null,
              invoiceAssistant: null
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch shared recording details:", err);
    }
  };

  const postViewerComment = async (author: string, text: string, timestamp?: string) => {
    if (!viewerRecordingId || !author.trim() || !text.trim()) return;
    try {
      const response = await fetch(`/api/shared-recordings/${viewerRecordingId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text, timestamp })
      });
      if (response.ok) {
        const data = await response.json();
        setViewerComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const incrementViewerEmoji = async (type: 'thumbsup' | 'clap' | 'heart' | 'rocket' | 'party') => {
    if (!viewerRecordingId) return;
    try {
      const response = await fetch(`/api/shared-recordings/${viewerRecordingId}/emojis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (response.ok) {
        const data = await response.json();
        setViewerEmojis(data.emojis || { thumbsup: 0, clap: 0, heart: 0, rocket: 0, party: 0 });
      }
    } catch (err) {
      console.error("Failed to react with emoji:", err);
    }
  };

  const approveViewerProposal = async (signer: string) => {
    if (!viewerRecordingId || !signer.trim()) return;
    try {
      const response = await fetch(`/api/shared-recordings/${viewerRecordingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: signer })
      });
      if (response.ok) {
        const data = await response.json();
        setIsViewerApproved(data.isApproved || false);
        setViewerApprovedBy(data.approvedBy || '');
      }
    } catch (err) {
      console.error("Failed to sign proposal:", err);
    }
  };

  const handleShareWorkspace = async (rec: Recording) => {
    setIsUploadingShare(true);
    try {
      let base64Video: string | null = null;
      if (recordedBlob) {
        try {
          base64Video = await blobToBase64(recordedBlob);
        } catch (e) {
          console.warn("Base64 conversion failed, skipping video upload payload:", e);
        }
      }
      
      const response = await fetch('/api/shared-recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.id,
          recording: rec,
          videoData: base64Video || undefined
        })
      });

      if (response.ok) {
        const originUrl = window.location.origin + window.location.pathname;
        const finalShareUrl = `${originUrl}?demoId=${rec.id}`;
        setSharedLinkUrl(finalShareUrl);
        setShowShareSuccessModal(true);
        navigator.clipboard.writeText(finalShareUrl);
      } else {
        alert("Unable to save shared workspace to the server.");
      }
    } catch (err) {
      console.error("Failed to share workspace:", err);
      alert("Error occurred during workspace sharing.");
    } finally {
      setIsUploadingShare(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ScribeBiz Client Viewer Workspace View
  if (isViewerMode) {
    if (!viewerRecording) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading Client Walkthrough Workspace...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-black" id="scribebiz-viewer-workspace">
        {/* HEADER */}
        <header className="h-16 border-b border-slate-905 bg-slate-950 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-slate-950 font-mono text-sm">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                ScribeBiz AI <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.2 rounded font-mono font-bold tracking-wider uppercase">Interactive Client Workspace</span>
              </h1>
              <p className="text-[10px] text-slate-500">Shared brief & deliverables hub for {viewerRecording.clientCompany}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">Secured with ScribeBiz AI</span>
            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname;
                window.location.href = url;
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              Launch Main Workspace
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: Video player, Chapters, Comments & Reactions */}
          <div className="w-full lg:w-[480px] border-b lg:border-b-0 lg:border-r border-slate-900 flex flex-col overflow-y-auto p-6 bg-slate-950/60 shrink-0 space-y-6">
            
            {/* Real Interactive Video Player */}
            <div className="space-y-3">
              <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner group">
                <video
                  src={viewerVideoData || viewerRecording.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={viewerRecording.thumbnailUrl}
                  id="viewer-mode-video-player"
                />
              </div>

              {/* Real-time Interactive Emoji Reaction Pad */}
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2">
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider text-center">Tap to react to the walkthrough</p>
                <div className="flex items-center justify-around">
                  {[
                    { key: 'thumbsup', emoji: '👍', label: 'Like' },
                    { key: 'clap', emoji: '👏', label: 'Clap' },
                    { key: 'heart', emoji: '❤️', label: 'Love' },
                    { key: 'rocket', emoji: '🚀', label: 'Rocket' },
                    { key: 'party', emoji: '🎉', label: 'Hype' },
                  ].map((emo) => (
                    <button
                      key={emo.key}
                      onClick={() => incrementViewerEmoji(emo.key as any)}
                      className="flex flex-col items-center gap-1 p-2 hover:bg-slate-900 rounded-lg transition group relative cursor-pointer"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-200">{emo.emoji}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-900">
                        {viewerEmojis[emo.key] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clickable AI Chapters Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Walkthrough Chapters
              </h3>
              <div className="space-y-1.5">
                {viewerRecording.chapters && viewerRecording.chapters.length > 0 ? (
                  viewerRecording.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-900/50 hover:bg-slate-900 border border-slate-900 rounded-lg flex gap-3 text-xs cursor-pointer transition"
                      onClick={() => {
                        const video = document.getElementById("viewer-mode-video-player") as HTMLVideoElement;
                        if (video) {
                          const pts = ch.time.split(':');
                          const secs = pts.length === 2 ? parseInt(pts[0])*60 + parseInt(pts[1]) : parseInt(pts[0]);
                          video.currentTime = secs;
                          video.play().catch(() => {});
                        } else {
                          alert(`Jumping preview directly to chapter time ${ch.time}`);
                        }
                      }}
                    >
                      <span className="font-mono text-emerald-400 font-bold shrink-0">{ch.time}</span>
                      <div>
                        <p className="font-semibold text-slate-200 leading-tight">{ch.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ch.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific chapters parsed for this video brief.</p>
                )}
              </div>
            </div>

            {/* Live Comments and Feedback Section */}
            <div className="space-y-3 pt-3 border-t border-slate-900 flex-1 flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Live Client Feedback
              </h3>

              {/* Comment submission form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const nameEl = form.elements.namedItem('viewerAuthor') as HTMLInputElement;
                  const textEl = form.elements.namedItem('viewerText') as HTMLTextAreaElement;
                  const checkEl = form.elements.namedItem('viewerUseTimestamp') as HTMLInputElement;
                  
                  let timestamp: string | undefined = undefined;
                  if (checkEl?.checked) {
                    const video = document.getElementById("viewer-mode-video-player") as HTMLVideoElement;
                    if (video) {
                      const mins = Math.floor(video.currentTime / 60);
                      const secs = Math.floor(video.currentTime % 60);
                      timestamp = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                    } else {
                      timestamp = "0:15";
                    }
                  }

                  if (nameEl.value && textEl.value) {
                    postViewerComment(nameEl.value, textEl.value, timestamp);
                    textEl.value = '';
                  }
                }}
                className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2.5"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="viewerAuthor"
                    required
                    placeholder="Your Name (e.g., Sarah C.)"
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      name="viewerUseTimestamp"
                      className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Attach time stamp</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <textarea
                    name="viewerText"
                    required
                    rows={2}
                    placeholder="Ask questions or suggest edits..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-3.5 rounded transition self-end h-8 cursor-pointer font-mono"
                  >
                    Post
                  </button>
                </div>
              </form>

              {/* Comments stream list */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {viewerComments.length > 0 ? (
                  viewerComments.map((com) => (
                    <div key={com.id} className="p-3 bg-slate-900/20 border border-slate-900/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                          <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-[10px] uppercase text-indigo-400 font-bold shrink-0">
                            {com.author.slice(0, 2)}
                          </span>
                          {com.author}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {com.timestamp && (
                            <span 
                              onClick={() => {
                                const video = document.getElementById("viewer-mode-video-player") as HTMLVideoElement;
                                if (video) {
                                  const pts = com.timestamp.split(':');
                                  const secs = pts.length === 2 ? parseInt(pts[0])*60 + parseInt(pts[1]) : parseInt(pts[0]);
                                  video.currentTime = secs;
                                  video.play().catch(() => {});
                                }
                              }}
                              className="bg-indigo-950 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition flex items-center gap-0.5"
                            >
                              <Clock className="w-2.5 h-2.5" /> {com.timestamp}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono">{com.createdAt}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 pl-6 leading-relaxed select-text font-mono">{com.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4">No comments posted yet. Add client feedback above!</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: AI Explanations and deliverables */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Upper Info Banner */}
            <div className="p-6 bg-slate-950/40 border-b border-slate-900 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">{viewerRecording.title}</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                {viewerRecording.summary || "This client delivery hub packages the screen recording walkthrough with automated business proposals, bug reports, and next steps."}
              </p>
            </div>

            {/* Middle Grid of Deliverables */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Segment: Clean Client Message & Translation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Client Plain Message
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {viewerRecording.clientExplanation || "Here is a clean walkthrough of the design layouts and responsive menus we updated for you."}
                  </p>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" /> Non-Technical Highlights
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {viewerRecording.nonTechnicalExplanation || "Mobile friendly styles and z-index offsets configured for beautiful viewing on screens of all sizes."}
                  </p>
                </div>
              </div>

              {/* Proposal & SOW Signoff Gated Block */}
              <div className="p-5 bg-gradient-to-br from-slate-900/90 to-indigo-950/20 border border-slate-900 rounded-xl space-y-4">
                <div className="flex items-start justify-between border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" /> Milestone SOW & Scope Approval
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Review the Scope of Work details and sign off below to approve pricing and timeline deliverables.</p>
                  </div>
                  
                  <span className="bg-indigo-950 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    Official Scope
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">1. SOW Summary</span>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 h-32 overflow-y-auto whitespace-pre-wrap">
                      {viewerRecording.scopeDoc || "Consulting milestone review of client pages."}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">2. Proposal Terms & Pricing</span>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 h-32 overflow-y-auto space-y-1.5">
                      <p>💵 <strong className="text-white">Milestone Price:</strong> {viewerRecording.proposalAssistant?.pricing || "$1,250.00 USD"}</p>
                      <p>⏱️ <strong className="text-white">Timeline:</strong> {viewerRecording.proposalAssistant?.timeline || "5 Days from approval"}</p>
                      <p className="text-slate-400 text-xs">📝 <strong className="text-slate-300">Contract Terms:</strong> {viewerRecording.proposalAssistant?.proposal || "Work starts upon approval."}</p>
                    </div>
                  </div>
                </div>

                {/* Approve Signoff signature block */}
                <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {isViewerApproved ? (
                    <div className="w-full flex items-center justify-between p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-white">Proposal Signed & Approved!</p>
                          <p className="text-[10px] text-emerald-400">Authorized by {viewerApprovedBy}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Status: IN PROGRESS</span>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const sig = (e.currentTarget.elements.namedItem('signerName') as HTMLInputElement).value;
                        if (sig) approveViewerProposal(sig);
                      }}
                      className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                    >
                      <input
                        type="text"
                        name="signerName"
                        required
                        placeholder="Type Full Name to Authorize & Sign"
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 justify-center"
                      >
                        <Check className="w-4 h-4" /> Sign & Approve Proposal
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Action items and bug reports */}
              {viewerRecording.actionItems && viewerRecording.actionItems.length > 0 && (
                <div className="p-5 bg-slate-900/20 border border-slate-900 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 font-mono">Meeting Action Items Checklist</h3>
                  <div className="space-y-1.5">
                    {viewerRecording.actionItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-mono">
                        <span className="w-5 h-5 rounded bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-[10px] text-slate-400 mt-0.5 shrink-0">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOP Guide details */}
              {viewerRecording.sop && (
                <div className="p-5 bg-slate-900/20 border border-slate-900 rounded-xl space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Standard Operating Procedure (SOP)
                  </h3>
                  <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-900 text-xs text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
                    <SimpleMarkdown text={viewerRecording.sop} />
                  </div>
                </div>
              )}

              {/* Bug scenarios */}
              {viewerRecording.bugReport && (
                <div className="p-5 bg-red-950/5 border border-red-900/20 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-red-400 font-mono flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5" /> Identified Issue Details
                  </h3>
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-900 text-xs">
                    <SimpleMarkdown text={viewerRecording.bugReport} />
                  </div>
                </div>
              )}

            </div>

            {/* Outer Branding Banner */}
            <div className="p-5 bg-slate-950 border-t border-slate-900 text-center shrink-0">
              <p className="text-xs text-slate-400">
                Want to record screen videos and turn them into beautiful client briefs automatically?{" "}
                <button
                  onClick={() => {
                    const url = window.location.origin + window.location.pathname;
                    window.location.href = url;
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1 cursor-pointer bg-transparent border-0"
                >
                  Get Started for Free with ScribeBiz AI
                </button>
              </p>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-black" id="scribebiz-app-container">
      
      {/* GLOBAL BANNER PROACTIVE AI SUGGESTIONS */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-emerald-950/60 border-b border-indigo-900/50 py-2.5 px-4 text-xs flex items-center justify-between" id="proactive-banner">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider animate-pulse flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> SOLOPRENEUR AUTOMATION ACTIVE
          </span>
          <p className="text-slate-300">
            <span className="text-white font-semibold">Proactive Suggestion:</span> ScribeBiz scanned your last meeting. 
            {" "}We drafted a <strong className="text-emerald-400 font-medium">Follow-Up Email</strong> and <strong className="text-emerald-400 font-medium">Scope Document</strong> instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setActiveTab('recordings'); setDetailTab('business'); }}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/40 px-2.5 py-1 rounded transition border border-emerald-500/20"
          >
            Review Business Assets <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* CORE NAVBAR HEADER */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono">ScribeBiz AI</h1>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.2 rounded font-mono">v1.1</span>
            </div>
            <p className="text-xs text-slate-400">AI Business Operations for One-Person Agencies</p>
          </div>
        </div>

        {/* TOP STATUS AND STATS */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-slate-500">BUSINESS MEMORY</span>
            <span className="text-emerald-400 font-semibold">{recordings.length} Recordings Indexed</span>
          </div>
          <div className="w-px h-8 bg-slate-900" />
          <div className="flex flex-col items-end">
            <span className="text-slate-500">MONETIZATION STATUS</span>
            <span className="text-emerald-400 font-semibold">Active Tier ($99/mo)</span>
          </div>
          <div className="w-px h-8 bg-slate-900" />
          <div className="flex flex-col items-end">
            <span className="text-slate-500">INTEGRATIONS</span>
            <span className="text-indigo-400 font-semibold">5 connected</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRecordingModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10 hover:shadow-emerald-400/20"
            id="btn-trigger-recording"
          >
            <Plus className="w-4 h-4" /> Record Walkthrough
          </button>
        </div>
      </header>

      {/* WORKSPACE CONTENT BODY */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* APP SIDEBAR NAVIGATION */}
        <nav className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between py-6 shrink-0" id="app-sidebar">
          <div className="space-y-6">
            <div className="px-4">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider block mb-2 font-mono uppercase">Workspaces</span>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('recordings')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'recordings' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4" />
                    <span>Recordings Hub</span>
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full">{recordings.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('memory')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'memory' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Business Memory</span>
                </button>

                <button
                  onClick={() => setActiveTab('crm')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'crm' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}
                >
                  <Users className="w-4 h-4" />
                  <span>Client CRM Profiles</span>
                </button>
              </div>
            </div>

            <div className="px-4">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider block mb-2 font-mono uppercase">Monetize & Connect</span>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('revenue')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'revenue' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Revenue & Gateways</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Analytics Engine</span>
                </button>
              </div>
            </div>

            <div className="px-4">
              <div className="p-4 bg-gradient-to-br from-slate-900/90 to-indigo-950/20 border border-slate-800 rounded-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 mb-1">
                  <Cpu className="w-3 h-3" /> GEMINI LIVE INTELLIGENCE
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">API Key Configured</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  ScribeBiz generates dynamic summaries, follow-up emails, and handles interactive chatbot questions over transcripts.
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 space-y-3.5">
            <div className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-lg border border-slate-900">
              <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center font-bold text-xs text-indigo-200">
                ME
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Solopreneur Hub</p>
                <p className="text-[10px] text-slate-500">xonixsitsolutions</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 text-center font-mono">ScribeBiz AI Platform • 2026</p>
          </div>
        </nav>

        {/* MAIN PANEL CONTENT WINDOW */}
        <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col" id="app-main-pane">
          
          {/* TAB 1: RECORDINGS HUB & AI WORKSPACE */}
          {activeTab === 'recordings' && (
            <div className="flex-1 flex overflow-hidden" id="recordings-tab-view">
              
              {/* LEFT COLUMN: LIST OF RECORDINGS */}
              <div className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col shrink-0" id="recordings-sidebar-list">
                
                {/* SEARCH & FILTERS */}
                <div className="p-4 border-b border-slate-900 space-y-3 bg-slate-950/80">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search transcripts, clients..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                  
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition ${categoryFilter === 'all' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium' : 'bg-slate-900 text-slate-400 hover:bg-slate-800/60'}`}
                    >
                      All ({recordings.length})
                    </button>
                    <button
                      onClick={() => setCategoryFilter('bugs')}
                      className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition flex items-center gap-1 ${categoryFilter === 'bugs' ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-medium' : 'bg-slate-900 text-slate-400 hover:bg-slate-800/60'}`}
                    >
                      <Bug className="w-3 h-3" /> Bugs
                    </button>
                    <button
                      onClick={() => setCategoryFilter('sop')}
                      className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition flex items-center gap-1 ${categoryFilter === 'sop' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium' : 'bg-slate-900 text-slate-400 hover:bg-slate-800/60'}`}
                    >
                      <BookOpen className="w-3 h-3" /> SOPs
                    </button>
                  </div>
                </div>

                {/* RECORDINGS SCROLL CONTAINER */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-900/50" id="recordings-scrollable-items">
                  {filteredRecordings.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">No recordings found</p>
                      <p className="text-[10px] text-slate-500">Try creating a new custom video mockup.</p>
                    </div>
                  ) : (
                    filteredRecordings.map((rec) => {
                      const isSelected = rec.id === selectedRecordingId;
                      return (
                        <div
                          key={rec.id}
                          onClick={() => { setSelectedRecordingId(rec.id); setChatHistory([{ role: 'assistant', content: `Ask ScribeBiz Chatbot anything about "${rec.title}" walkthrough transcript.` }]); }}
                          className={`p-4 cursor-pointer transition flex gap-3 relative group ${isSelected ? 'bg-slate-900/60 border-l-2 border-indigo-500' : 'hover:bg-slate-900/25'}`}
                        >
                          {/* Recording Thumbnail */}
                          <div className="w-16 h-16 rounded bg-slate-900 shrink-0 overflow-hidden border border-slate-800 relative">
                            <img src={rec.thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white opacity-80" />
                            </div>
                            <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[9px] px-1 rounded font-mono text-slate-300">
                              {rec.duration}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-indigo-400 tracking-wider uppercase font-mono">{rec.clientCompany}</span>
                              <button
                                onClick={(e) => handleDeleteRecording(rec.id, e)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                                title="Delete recording"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-tight group-hover:text-indigo-300 transition">
                              {rec.title}
                            </h3>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" /> {rec.clientName}
                              </span>
                              <span className="text-[9px] text-slate-500">{rec.createdAt.split(',')[0]}</span>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex gap-1.5 pt-1.5">
                              {rec.bugReport && (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                                  <Bug className="w-2.5 h-2.5" /> BUG
                                </span>
                              )}
                              {rec.sop && (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                                  <BookOpen className="w-2.5 h-2.5" /> SOP
                                </span>
                              )}
                              {gatedRecordings[rec.id]?.active && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> GATED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT ROW: DETAILED SCREEN AND TABS PANEL */}
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden" id="recording-details-pane">
                {!selectedRecording ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Video className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">No Walkthroughs Found</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        No walkthroughs have been recorded yet. Click the **Record New Walkthrough** button to share your screen & voice, or use one of our templates to generate a new AI-enhanced dashboard instantly.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsRecordingModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="w-4 h-4" /> Record New Walkthrough
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ACTIVE WALKTHROUGH TITLE */}
                    <div className="p-6 border-b border-slate-900 bg-slate-950/40 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider">
                        {selectedRecording.project || 'General Strategy'}
                      </span>
                      <span className="text-xs text-slate-500">Walkthrough Recorded on {selectedRecording.createdAt}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight leading-snug">{selectedRecording.title}</h2>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Client: <strong className="text-slate-200">{selectedRecording.clientName}</strong> ({selectedRecording.clientCompany})</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      <span>Duration: <strong className="text-slate-200">{selectedRecording.duration}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerCopy(selectedRecording.transcript, 'transcript-copy')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 transition flex items-center gap-1.5"
                    >
                      {copiedText === 'transcript-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Transcript
                    </button>
                    <button
                      onClick={() => handleShareWorkspace(selectedRecording)}
                      disabled={isUploadingShare}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isUploadingShare ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Uploading Demo...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          Share Client Workspace
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* TWO COLUMN DETAIL LAYOUT */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* VIDEO PLAYER & INTERACTIVE TRANSCRIPT COLUMN */}
                  <div className="w-[450px] border-r border-slate-900 flex flex-col overflow-y-auto p-6 bg-slate-950/60 shrink-0 space-y-6">
                    
                     {/* VIDEO PLAYBACK PLAYER */}
                     <div className="space-y-3">
                      <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner group">
                        <video
                          src={selectedRecording.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                          controls
                          className="w-full h-full object-contain"
                          poster={selectedRecording.thumbnailUrl}
                          id="active-walkthrough-video-element"
                        />
                      </div>

                      {/* CHAPTER TIMELINE CLICKABLE LIST */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> Interactive AI Chapters
                        </h4>
                        <div className="space-y-1.5">
                          {selectedRecording.chapters && selectedRecording.chapters.length > 0 ? (
                            selectedRecording.chapters.map((ch, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-900 rounded-lg flex gap-3 text-xs cursor-pointer transition"
                                onClick={() => alert(`Jumping media player directly to chapter ${ch.time}: ${ch.title}`)}
                              >
                                <span className="font-mono text-emerald-400 font-bold shrink-0">{ch.time}</span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-200 leading-tight">{ch.title}</p>
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{ch.description}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">No segment chapters parsed yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CORE TEXT TRANSCRIPTION */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400 font-mono">Walkthrough Transcript</h4>
                        <span className="text-[10px] text-slate-500 font-mono">Speech-to-Text accurate</span>
                      </div>
                      <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs text-slate-300 leading-relaxed font-mono max-h-60 overflow-y-auto">
                        <p className="indent-4 select-text">
                          {selectedRecording.transcript}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* AI DELIVERABLES TABBED CONTENT ENGINE */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* TABS SELECTOR */}
                    <div className="border-b border-slate-900 bg-slate-950 px-4 flex gap-1 overflow-x-auto shrink-0">
                      <button
                        onClick={() => setDetailTab('summary')}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'summary' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Summary Hub
                      </button>
                      
                      <button
                        onClick={() => setDetailTab('sharing')}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'sharing' ? 'border-sky-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <Share2 className="w-3.5 h-3.5 text-sky-400" /> Share & Screen Details
                      </button>

                      <button
                        onClick={() => setDetailTab('business')}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'business' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-emerald-400" /> Client Automations
                      </button>

                      <button
                        onClick={() => setDetailTab('chat')}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'chat' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Video Chatbot
                      </button>

                      {selectedRecording.sop && (
                        <button
                          onClick={() => setDetailTab('sop')}
                          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'sop' ? 'border-amber-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" /> SOP Guide
                        </button>
                      )}

                      {selectedRecording.bugReport && (
                        <button
                          onClick={() => setDetailTab('bug')}
                          className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'bug' ? 'border-red-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                        >
                          <Bug className="w-3.5 h-3.5 text-red-400" /> Bug Report
                        </button>
                      )}

                      <button
                        onClick={() => setDetailTab('repurpose')}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'repurpose' ? 'border-pink-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <Megaphone className="w-3.5 h-3.5 text-pink-400" /> Social Repurpose
                      </button>

                      <button
                        onClick={() => setDetailTab('financials')}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${detailTab === 'financials' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-400" /> Proposal & Invoicing
                      </button>
                    </div>

                    {/* ACTIVE DELIVERABLE CONTAINER */}
                    <div className="flex-1 overflow-y-auto p-6" id="deliverable-content-scroller">
                      
                      {/* TAB: SUMMARY HUB */}
                      {detailTab === 'summary' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2">
                              <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Executive Summary
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                                {selectedRecording.executiveSummary}
                              </p>
                            </div>
                            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2">
                              <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-emerald-400" /> Client Explanation
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                                {selectedRecording.clientExplanation}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2">
                              <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-amber-400" /> Technical Translation
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                                {selectedRecording.technicalExplanation}
                              </p>
                            </div>
                            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2">
                              <h3 className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-teal-400" /> Non-Technical Translation
                              </h3>
                              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                                {selectedRecording.nonTechnicalExplanation}
                              </p>
                            </div>
                          </div>

                          {/* KEY WALKTHROUGH HIGHLIGHTS */}
                          <div className="p-5 bg-slate-900/20 rounded-xl border border-slate-900 space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 font-mono">Meeting Highlights</h3>
                            <ul className="space-y-2 text-xs text-slate-300 font-mono">
                              {selectedRecording.highlights.map((high, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded bg-emerald-950 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] text-emerald-400 mt-0.5 shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span>{high}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* TAB: BUSINESS AUTOMATION & CLIENT COMMUNICATIONS */}
                      {detailTab === 'business' && (
                        <div className="space-y-6">
                          
                          {/* ACTION ITEMS INTERACTIVE CHECKLIST */}
                          <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                              <div>
                                <h3 className="text-xs font-bold text-slate-300 font-mono">Action Items Checklist</h3>
                                <p className="text-[10px] text-slate-500">Auto-extracted from your speech. Check to resolve.</p>
                              </div>
                              <span className="bg-indigo-950 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono px-2 py-0.5 rounded">
                                {selectedRecording.actionItems.length} Identified
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {selectedRecording.actionItems.map((item, idx) => {
                                const isChecked = !!checkedActions[`${selectedRecording.id}-${idx}`];
                                return (
                                  <label
                                    key={idx}
                                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer ${isChecked ? 'bg-emerald-950/10 border-emerald-900/30 text-slate-500' : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-200'}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => setCheckedActions(prev => ({
                                        ...prev,
                                        [`${selectedRecording.id}-${idx}`]: !isChecked
                                      }))}
                                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 mt-0.5 w-4 h-4"
                                    />
                                    <span className={`text-xs ${isChecked ? 'line-through' : ''}`}>{item}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* AUTOMATED FOLLOW UP EMAIL */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold text-slate-400 font-mono">Ready-to-Send Client Follow-up</h3>
                              <button
                                onClick={() => triggerCopy(selectedRecording.followUpEmail, 'copy-email')}
                                className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
                              >
                                {copiedText === 'copy-email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedText === 'copy-email' ? 'Copied Email' : 'Copy Email to Clipboard'}
                              </button>
                            </div>
                            <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl font-mono text-xs whitespace-pre-wrap text-slate-300 leading-relaxed relative">
                              {selectedRecording.followUpEmail}
                            </div>
                          </div>

                          {/* MEETING MINUTES AND SOW SCOPE BLOCK */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-400 font-mono">Formal Meeting Minutes</h4>
                              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs max-h-60 overflow-y-auto">
                                <SimpleMarkdown text={selectedRecording.meetingMinutes} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-400 font-mono">Scope of Work Document (SOW)</h4>
                              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs max-h-60 overflow-y-auto">
                                <SimpleMarkdown text={selectedRecording.scopeDoc} />
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* TAB: SOP & DOCUMENTATION GENERATOR */}
                      {detailTab === 'sop' && selectedRecording.sop && (
                        <div className="space-y-6">
                          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-bold text-amber-300 font-mono">Standard Operating Procedure Generated</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Your spoken tutorial was converted to a structured company SOP. This asset is ready to publish to Notion or your help desk.
                              </p>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <div>
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/20">
                                  {selectedRecording.sop.category} SOP
                                </span>
                                <h3 className="text-lg font-bold text-slate-100 mt-1">{selectedRecording.sop.title}</h3>
                              </div>
                              <button
                                onClick={() => triggerCopy(selectedRecording.sop!.content, 'copy-sop')}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition"
                              >
                                {copiedText === 'copy-sop' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                Copy SOP Markdown
                              </button>
                            </div>

                            <SimpleMarkdown text={selectedRecording.sop.content} />

                            <div className="pt-4 border-t border-slate-800 space-y-2">
                              <h4 className="text-xs font-mono font-bold text-slate-400">Chronological Training Checklist</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {selectedRecording.sop.steps.map((st, i) => (
                                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-900/40 rounded border border-slate-900 font-mono">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>Step {i+1}: {st}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: INTERACTIVE VIDEO CHATBOT */}
                      {detailTab === 'chat' && (
                        <div className="flex flex-col h-[400px] border border-slate-900 rounded-xl overflow-hidden bg-slate-950/60">
                          
                          {/* CHAT MESSAGES DISPLAY */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatHistory.map((chat, index) => (
                              <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${chat.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                                  <p className="font-semibold text-[10px] font-mono text-slate-400 mb-1">
                                    {chat.role === 'user' ? 'YOU (Solopreneur)' : 'ScribeBiz AI ASSISTANT'}
                                  </p>
                                  <div className="font-mono whitespace-pre-wrap select-text">
                                    {chat.role === 'assistant' ? <SimpleMarkdown text={chat.content} /> : chat.content}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {isSendingChat && (
                              <div className="flex justify-start">
                                <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl p-3.5 text-xs flex items-center gap-2 font-mono">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> Synthesizing answer over walkthrough transcript...
                                </div>
                              </div>
                            )}
                          </div>

                          {/* SMART PROMPT SUGGESTIONS */}
                          <div className="px-4 py-2 border-t border-slate-900 bg-slate-900/10 flex gap-1.5 overflow-x-auto text-[10px] shrink-0">
                            <span className="text-slate-500 font-mono whitespace-nowrap pt-1">Ask ScribeBiz:</span>
                            {[
                              "Extract all action items",
                              "Draft follow-up email",
                              "Explain like a beginner",
                              "Write custom blog post"
                            ].map((suggestion, i) => (
                              <button
                                key={i}
                                onClick={() => askRecordingChat(undefined, suggestion)}
                                className="bg-slate-900 hover:bg-indigo-950/50 hover:text-indigo-300 border border-slate-800 text-slate-300 px-2.5 py-1 rounded whitespace-nowrap transition"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>

                          {/* CHAT INPUT FORM */}
                          <form onSubmit={askRecordingChat} className="p-3 bg-slate-950 border-t border-slate-900 flex gap-2 shrink-0">
                            <input
                              type="text"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              placeholder="Type something... (e.g., Generate a professional SOP step checklist)"
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="submit"
                              disabled={isSendingChat}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      )}

                      {/* TAB: BUG REPORT DESIGN */}
                      {detailTab === 'bug' && selectedRecording.bugReport && (
                        <div className="space-y-6">
                          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-bold text-red-300 font-mono">High Severity UX Layout Bug Detected</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                AI parsed layout errors in your design presentation. A developer-ready issue checklist has been constructed.
                              </p>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                              <div>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${selectedRecording.bugReport.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                  {selectedRecording.bugReport.severity} SEVERITY BUG
                                </span>
                                <h3 className="text-lg font-bold text-slate-100 mt-1">{selectedRecording.bugReport.title}</h3>
                              </div>
                              <button
                                onClick={() => alert('Bug Report pushed to synchronized Board (GitHub / Jira Simulator)')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Push to GitHub / Jira
                              </button>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-xs font-mono font-bold text-slate-400">Issue Description</h4>
                              <p className="text-xs text-slate-300 leading-relaxed font-mono">{selectedRecording.bugReport.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-900/80 space-y-2">
                                <h4 className="text-xs font-mono font-bold text-slate-400">Actual Layout Response</h4>
                                <p className="text-xs text-red-300 font-mono">{selectedRecording.bugReport.actualResult}</p>
                              </div>
                              <div className="p-4 bg-emerald-950/10 rounded-lg border border-emerald-900/20 space-y-2">
                                <h4 className="text-xs font-mono font-bold text-slate-400">Expected Design Layout</h4>
                                <p className="text-xs text-emerald-300 font-mono">{selectedRecording.bugReport.expectedResult}</p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              <h4 className="text-xs font-mono font-bold text-slate-400">Step-by-Step Reproduction Checklist</h4>
                              <ol className="space-y-1.5 text-xs text-slate-300">
                                {selectedRecording.bugReport.reproductionSteps.map((step, i) => (
                                  <li key={i} className="flex gap-2 font-mono">
                                    <span className="text-slate-500 font-bold">{i+1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: CONTENT REPURPOSING */}
                      {detailTab === 'repurpose' && selectedRecording.repurposedContent && (
                        <div className="space-y-6">
                          
                          {/* LINKEDIN AND TWITTER REPURPOSING */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20">LinkedIn Post</span>
                                <button
                                  onClick={() => triggerCopy(selectedRecording.repurposedContent!.linkedIn, 'copy-li')}
                                  className="text-emerald-400 text-xs font-semibold hover:underline"
                                >
                                  Copy Post
                                </button>
                              </div>
                              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
                                {selectedRecording.repurposedContent.linkedIn}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-500/20">Twitter Thread (X)</span>
                                <button
                                  onClick={() => triggerCopy(selectedRecording.repurposedContent!.twitterThread.join('\n\n'), 'copy-tw')}
                                  className="text-emerald-400 text-xs font-semibold hover:underline"
                                >
                                  Copy Thread
                                </button>
                              </div>
                              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {selectedRecording.repurposedContent.twitterThread.map((tweet, i) => (
                                  <div key={i} className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg text-xs font-mono text-slate-300">
                                    {tweet}
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>

                          {/* BLOG ARTICLE & NEWSLETTER CAMPAIGN */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="bg-pink-500/10 text-pink-400 text-[10px] font-mono px-2 py-0.5 rounded border border-pink-500/20">SEO Blog Article</span>
                                <button
                                  onClick={() => triggerCopy(selectedRecording.repurposedContent!.blogArticle, 'copy-blog')}
                                  className="text-emerald-400 text-xs font-semibold hover:underline"
                                >
                                  Copy Blog
                                </button>
                              </div>
                              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs max-h-80 overflow-y-auto">
                                <SimpleMarkdown text={selectedRecording.repurposedContent.blogArticle} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">Newsletter Campaign</span>
                                <button
                                  onClick={() => triggerCopy(selectedRecording.repurposedContent!.newsletter, 'copy-news')}
                                  className="text-emerald-400 text-xs font-semibold hover:underline"
                                >
                                  Copy Newsletter
                                </button>
                              </div>
                              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs font-mono text-slate-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                                {selectedRecording.repurposedContent.newsletter}
                              </div>
                            </div>

                          </div>

                        </div>
                      )}

                      {/* TAB: CONTRACTS & FINANCIAL INVOICES */}
                      {detailTab === 'financials' && (
                        <div className="space-y-6">
                          
                          {/* INVOICE ASSISTANT */}
                          {selectedRecording.invoiceAssistant && (
                            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-900 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-5 h-5 text-emerald-400" />
                                  <div>
                                    <h3 className="text-base font-bold text-slate-100">AI Generated Invoice Proposal</h3>
                                    <p className="text-[10px] text-slate-400">Derived from consulting time mentioned in walkthrough</p>
                                  </div>
                                </div>
                                <span className="text-lg font-black text-emerald-400 font-mono">
                                  {selectedRecording.invoiceAssistant.amount}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div className="space-y-2">
                                  <h4 className="text-slate-500">LINE ITEM DESCRIPTION</h4>
                                  <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-900">
                                    {selectedRecording.invoiceAssistant.description}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-slate-500">HOURS LOGGED / CALCULATION</h4>
                                  <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-900">
                                    {selectedRecording.invoiceAssistant.timeSummary}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1 pt-2">
                                <h4 className="text-xs font-mono text-slate-500">BILLING NOTES</h4>
                                <p className="text-xs text-slate-300 italic">{selectedRecording.invoiceAssistant.billingNotes}</p>
                              </div>

                              <div className="pt-2 flex gap-2">
                                <button
                                  onClick={() => alert('Invoice template synchronizing with your Connected Stripe account!')}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Generate Live Invoice link on Stripe
                                </button>
                              </div>
                            </div>
                          )}

                          {/* PROPOSAL ASSISTANT */}
                          {selectedRecording.proposalAssistant ? (
                            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-900 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-indigo-400" /> Expanded Project Proposal
                                </h3>
                                <button
                                  onClick={() => triggerCopy(selectedRecording.proposalAssistant!.proposal, 'copy-prop')}
                                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" /> Copy Proposal
                                </button>
                              </div>

                              <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1 font-mono">
                                    <h4 className="text-slate-500">PROPOSED WORK SCOPE</h4>
                                    <p className="text-slate-200">{selectedRecording.proposalAssistant.proposal}</p>
                                  </div>
                                  <div className="space-y-1 font-mono">
                                    <h4 className="text-slate-500">ESTIMATED TIMELINE</h4>
                                    <p className="text-slate-200">{selectedRecording.proposalAssistant.timeline}</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-900 space-y-2">
                                  <h4 className="text-xs font-bold text-slate-400 font-mono">Short-form Legal Contract Draft</h4>
                                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed italic">
                                    {selectedRecording.proposalAssistant.contract}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-8 bg-slate-900/10 border border-slate-900 rounded-xl">
                              <p className="text-xs text-slate-500">No expanded proposal models compiled for this video context.</p>
                            </div>
                          )}

                        </div>
                      )}

                      {/* TAB: SHARING & SCREEN DETAILS */}
                      {detailTab === 'sharing' && (
                        <div className="space-y-6">
                          
                          {/* GRID FOR SHARING OPTIONS AND SCREEN SPECS */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* VIDEO SHARING OPTIONS */}
                            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-900 space-y-4">
                              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-sky-400" /> Walkthrough Sharing Settings
                              </h3>
                              <p className="text-xs text-slate-400">
                                Share this video walkthrough with your client. They can play the real video, view AI deliverables, add comments at specific timestamps, toggle reactions, and approve proposal milestones.
                              </p>

                              {/* SHARING LINK BOX */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">1. Shared Client Workspace URL</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}${window.location.pathname}?demoId=${selectedRecording.id}`}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                                    id="shared-workspace-link-input"
                                  />
                                  <button
                                    onClick={() => {
                                      const link = `${window.location.origin}${window.location.pathname}?demoId=${selectedRecording.id}`;
                                      triggerCopy(link, 'copy-share-tab-link');
                                    }}
                                    className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                                  >
                                    {copiedText === 'copy-share-tab-link' ? 'Copied!' : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" /> Copy Link
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* EMBED CODE BOX */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">2. Embed in Notion / Wiki (iFrame Code)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={`<iframe src="${window.location.origin}${window.location.pathname}?demoId=${selectedRecording.id}" width="100%" height="600" frameborder="0" allow="camera; microphone; clipboard-write"></iframe>`}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                                    id="shared-workspace-embed-input"
                                  />
                                  <button
                                    onClick={() => {
                                      const embed = `<iframe src="${window.location.origin}${window.location.pathname}?demoId=${selectedRecording.id}" width="100%" height="600" frameborder="0" allow="camera; microphone; clipboard-write"></iframe>`;
                                      triggerCopy(embed, 'copy-share-tab-embed');
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                                  >
                                    {copiedText === 'copy-share-tab-embed' ? 'Copied!' : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" /> Copy Code
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* EMAIL TEMPLATE ACCORDION */}
                              <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-emerald-400" /> Shareable Email Template
                                  </span>
                                  <button
                                    onClick={() => {
                                      const emailText = `Hi ${selectedRecording.clientName},\n\nI have recorded a quick screen walkthrough review of "${selectedRecording.title}" for our project "${selectedRecording.project}".\n\nYou can view the recorded video, leave comments, add emojis, and sign off on our milestones here: ${window.location.origin}${window.location.pathname}?demoId=${selectedRecording.id}\n\nLet me know if you have any questions!\n\nBest regards,\n[Your Name]`;
                                      triggerCopy(emailText, 'copy-share-tab-email');
                                    }}
                                    className="text-[11px] text-emerald-400 hover:underline"
                                  >
                                    {copiedText === 'copy-share-tab-email' ? 'Copied Template!' : 'Copy Template'}
                                  </button>
                                </div>
                                <div className="p-2 bg-slate-900/60 rounded text-[11px] font-mono text-slate-400 leading-relaxed max-h-32 overflow-y-auto">
                                  <p className="font-bold text-slate-300">Subject: Project Walkthrough: {selectedRecording.title}</p>
                                  <p className="mt-1">Hi {selectedRecording.clientName},</p>
                                  <p className="mt-1">I have recorded a quick screen walkthrough review of "{selectedRecording.title}"...</p>
                                  <p className="mt-1 text-sky-400">Link: {window.location.origin}{window.location.pathname}?demoId={selectedRecording.id}</p>
                                </div>
                              </div>
                            </div>

                            {/* RECORDED SCREEN & VIDEO SPECS */}
                            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-900 space-y-4">
                              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-emerald-400" /> Screen & Video Capture Metadata
                              </h3>
                              <p className="text-xs text-slate-400">
                                Technical capture details extracted directly from the browser's recording pipeline. Displays real resolution, codec, and file parameters.
                              </p>

                              {/* SPECS GRID */}
                              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Capture Source</span>
                                  <span className="text-slate-200 flex items-center gap-1.5 font-bold">
                                    {selectedRecording.isRealScreen ? (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Real Screen Share
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                        Simulated Sandbox
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Video Codec</span>
                                  <span className="text-slate-200 font-bold">{selectedRecording.mimeType || 'video/webm; codecs=vp9'}</span>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Capture Resolution</span>
                                  <span className="text-slate-200 font-bold">{selectedRecording.resolution || '1920x1080'}</span>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Video Size</span>
                                  <span className="text-slate-200 font-bold">{selectedRecording.videoSize || '5.8 MB'}</span>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Walkthrough Duration</span>
                                  <span className="text-slate-200 font-bold">{selectedRecording.duration}</span>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Audio Capture</span>
                                  <span className="text-slate-200 font-bold">Mic Input Enabled</span>
                                </div>
                              </div>

                              {/* DOWNLOAD BUTTONS */}
                              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                {selectedRecording.videoUrl ? (
                                  <a
                                    href={selectedRecording.videoUrl}
                                    download={`${selectedRecording.title.toLowerCase().replace(/\s+/g, '_')}_recording.webm`}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download Recorded WebM Video
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => alert("This is a simulated walkthrough. Record a real screen session to enable raw video download.")}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download Simulated Walkthrough Video
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>

                          {/* MILESTONE PRICE GATE CONTROL CARD */}
                          <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-900 space-y-4">
                            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <Lock className="w-4 h-4 text-indigo-400" /> Milestone SOW Pricing Gate
                            </h3>
                            <p className="text-xs text-slate-400">
                              When enabled, the client must review the Statement of Work (SOW) and approve the milestone fee before unlocking the full recording downloads or final deliverables.
                            </p>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950 rounded-lg border border-slate-900">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  Pricing Gate Status: 
                                  {gatedRecordings[selectedRecording.id]?.active ? (
                                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/20">Active Price Gate</span>
                                  ) : (
                                    <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800">Inactive / Open Access</span>
                                  )}
                                </span>
                                <p className="text-[11px] text-slate-500">Enable pricing to secure contract payouts.</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 font-mono">Milestone Price:</span>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 text-xs font-mono bg-slate-900 border-y border-l border-slate-850 px-2.5 py-1 rounded-l-lg">$</span>
                                    <input
                                      type="number"
                                      value={gatedRecordings[selectedRecording.id]?.price || 49}
                                      onChange={(e) => {
                                        const newPrice = Math.max(0, parseInt(e.target.value) || 0);
                                        setGatedRecordings(prev => ({
                                          ...prev,
                                          [selectedRecording.id]: {
                                            ...prev[selectedRecording.id],
                                            price: newPrice
                                          }
                                        }));
                                      }}
                                      className="w-16 bg-slate-900 border border-slate-850 px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none"
                                    />
                                    <span className="text-slate-500 text-xs font-mono bg-slate-900 border-y border-r border-slate-850 px-2 py-1 rounded-r-lg">USD</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setGatedRecordings(prev => ({
                                      ...prev,
                                      [selectedRecording.id]: {
                                        ...prev[selectedRecording.id],
                                        active: !prev[selectedRecording.id]?.active
                                      }
                                    }));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${gatedRecordings[selectedRecording.id]?.active ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                >
                                  {gatedRecordings[selectedRecording.id]?.active ? 'Disable Gate' : 'Activate Gate'}
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </>
            )}

              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL KNOWLEDGE MEMORY */}
          {activeTab === 'memory' && (
            <div className="p-8 max-w-4xl mx-auto space-y-8 w-full" id="global-memory-tab">
              
              <div className="space-y-2">
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded text-xs font-mono uppercase font-bold tracking-wider">
                  ScribeBiz Neural Search
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">AI Centralized Business Memory</h2>
                <p className="text-sm text-slate-400">
                  Ask conversational questions across all processed screen recordings. Our AI operates as a virtual employee, instantly referencing spoken agreements, client specifications, and past budgets without you needing to watch videos.
                </p>
              </div>

              {/* CONVERSATIONAL SEARCH INPUT CARD */}
              <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
                <form onSubmit={askKnowledgeBase} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={globalQuestion}
                      onChange={(e) => setGlobalQuestion(e.target.value)}
                      placeholder="Ask ScribeBiz (e.g. Which client requested dark mode layout?)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isQueryingKB}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-6 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    {isQueryingKB ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Query Memory
                  </button>
                </form>

                {/* SUGGESTED CLICKABLE QUESTIONS */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 font-mono">Suggested Business Questions:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      "Which client requested pure black and emerald layout?",
                      "Find the recording where pricing was changed to $99",
                      "Show every video mentioning e-commerce GST tables",
                      "What action items did I promise Sarah Connor?"
                    ].map((sq, i) => (
                      <button
                        key={i}
                        onClick={() => askKnowledgeBase(undefined, sq)}
                        className="bg-slate-900 hover:bg-slate-850 hover:text-indigo-400 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 transition text-left"
                      >
                        "{sq}"
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* SEARCH ANSWER OR LOADING */}
              {isQueryingKB && (
                <div className="p-8 bg-slate-900/20 border border-slate-900 rounded-2xl text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">Querying vector index across indexed transcripts...</p>
                </div>
              )}

              {globalAnswer && !isQueryingKB && (
                <div className="space-y-4">
                  
                  {/* GENERATED ANSWER CONTAINER */}
                  <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-200">AI Synthesized Knowledge</h3>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        Verified Citation Reference
                      </span>
                    </div>

                    <div className="font-mono select-text leading-relaxed">
                      <SimpleMarkdown text={globalAnswer} />
                    </div>
                  </div>

                  {/* RELEVANT CITATIONS/VIDEO SEGMENTS */}
                  {globalSources.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold font-mono text-slate-500">Cited Video Transcripts:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {globalSources.map((source, index) => {
                          const realRec = recordings.find(r => r.id === source.id);
                          return (
                            <div
                              key={index}
                              onClick={() => { setSelectedRecordingId(source.id); setActiveTab('recordings'); }}
                              className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-900 rounded-xl cursor-pointer transition flex items-start gap-3"
                            >
                              <Play className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                              <div>
                                <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{source.title || realRec?.title}</h5>
                                <p className="text-[10px] text-slate-400 mt-1 leading-normal italic">
                                  "Reason: {source.reason}"
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 3: CLIENT CRM WORKSPACE */}
          {activeTab === 'crm' && (
            <div className="p-8 max-w-5xl mx-auto space-y-8 w-full" id="crm-tab-view">
              
              <div className="space-y-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-xs font-mono uppercase font-bold tracking-wider">
                  AI Client CRM Workspace
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">Active Client Memory Profiles</h2>
                <p className="text-sm text-slate-400">
                  Manage persistent customer rules, custom design aesthetics, standard writing styles, and invoicing terms. ScribeBiz automatically applies these preferences during AI workflow generation.
                </p>
              </div>

              {/* ADD NEW CLIENT FORM */}
              <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" /> Onboard New Client
                </h3>
                <form onSubmit={handleAddClient} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Client Contact Name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Company Name"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Project Name (e.g. Website Overhaul)"
                    value={newClientProject}
                    onChange={(e) => setNewClientProject(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg p-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" /> Save CRM Client
                  </button>
                </form>
              </div>

              {/* CLIENT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client) => {
                  const clientVideos = recordings.filter(r => r.clientName === client.name);
                  return (
                    <div key={client.id} className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              {client.company}
                            </span>
                            <h3 className="text-base font-bold text-white mt-1.5">{client.name}</h3>
                            <p className="text-xs text-slate-400">{client.email}</p>
                          </div>
                          
                          {/* Client Brand Palette Simulated indicators */}
                          <div className="flex gap-1.5">
                            <span className="w-4.5 h-4.5 rounded-full border border-slate-800" style={{ backgroundColor: client.brandColors.primary }} title="Primary Color" />
                            <span className="w-4.5 h-4.5 rounded-full border border-slate-800" style={{ backgroundColor: client.brandColors.secondary }} title="Accent Color" />
                          </div>
                        </div>

                        <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs font-mono">
                          <p className="text-slate-500 font-bold text-[9px]">ACTIVE DISCUSSIONS / PROJECT</p>
                          <p className="text-slate-200">{client.project}</p>
                        </div>

                        {/* PREFERENCES / AI MEMORY */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">AI Memory Settings</p>
                          <div className="space-y-1.5">
                            {client.preferences.map((pref, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{pref}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span>Style Tone: <strong className="text-slate-200">{client.writingStyle}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span>Base billing rate: <strong className="text-slate-200">{client.billingRate}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-mono">{clientVideos.length} Walkthroughs</span>
                        <button
                          onClick={() => {
                            if (clientVideos.length > 0) {
                              setSelectedRecordingId(clientVideos[0].id);
                              setActiveTab('recordings');
                            } else {
                              setIsRecordingModalOpen(true);
                              setSandboxClient(client.name);
                            }
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          {clientVideos.length > 0 ? 'View Client Hub' : 'Record first video'} <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 4: REVENUE GATEWAYS & SMART INTEGRATIONS */}
          {activeTab === 'revenue' && (
            <div className="p-8 max-w-5xl mx-auto space-y-8 w-full" id="revenue-tab-view">
              
              <div className="space-y-2">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded text-xs font-mono uppercase font-bold tracking-wider">
                  Monetize & Connect
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">ScribeBiz Revenue Operations</h2>
                <p className="text-sm text-slate-400">
                  Gate your recorded tutorials and client knowledge libraries behind Stripe paywalls. Offer monthly client subscriptions, sell specific video guides, and integrate with your existing tech stack automatically.
                </p>
              </div>

              {/* INTEGRATIONS & PAYWALL GRID SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* VIDEO PAYWALL GATEWAYS */}
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-4">
                  <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-emerald-400" /> Premium Knowledge Gating
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Allow users or teams to buy specific video walkthroughs.</p>
                    </div>
                    <span className="bg-emerald-950 text-emerald-400 text-xs font-mono px-2 py-0.5 rounded font-bold">
                      Stripe Enabled
                    </span>
                  </div>

                  <div className="space-y-4">
                    {recordings.map((rec) => {
                      const gateInfo = gatedRecordings[rec.id] || { price: 49, active: false };
                      return (
                        <div key={rec.id} className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{rec.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Client: {rec.clientName} | {rec.duration}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 font-mono">$</span>
                              <input
                                type="number"
                                value={gateInfo.price}
                                onChange={(e) => setGatedRecordings(prev => ({
                                  ...prev,
                                  [rec.id]: { ...gateInfo, price: parseInt(e.target.value) || 0 }
                                }))}
                                className="w-14 bg-slate-900 border border-slate-800 rounded p-1 text-xs text-center font-mono text-emerald-400 focus:outline-none"
                              />
                            </div>

                            {/* TOGGLE SWITCH */}
                            <button
                              onClick={() => setGatedRecordings(prev => ({
                                ...prev,
                                [rec.id]: { ...gateInfo, active: !gateInfo.active }
                              }))}
                              className={`w-11 h-6 rounded-full transition relative ${gateInfo.active ? 'bg-emerald-500' : 'bg-slate-800'}`}
                            >
                              <span className={`absolute top-1 left-1 bg-slate-950 w-4 h-4 rounded-full transition ${gateInfo.active ? 'translate-x-5 bg-white' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SYSTEM INTEGRATION CENTER */}
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-4">
                  <div className="border-b border-slate-900 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-400" /> Smart System Connectors
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Synchronize documentation, bugs, and invoices automatically.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {integrations.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400"><HardDrive className="w-4 h-4" /></span>
                            <span className="text-xs font-bold text-slate-200">{item.name}</span>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${item.connected ? 'bg-emerald-400 shadow shadow-emerald-400/50' : 'bg-slate-800'}`} />
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-slate-500">{item.connected ? `Last sync: ${item.lastSync || 'Never'}` : 'Disconnected'}</span>
                          <div className="flex gap-1.5">
                            {item.connected && (
                              <button
                                onClick={() => syncIntegration(item.id)}
                                className="text-indigo-400 hover:text-indigo-300"
                                title="Sync Now"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => toggleIntegration(item.id)}
                              className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded transition ${item.connected ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}
                            >
                              {item.connected ? 'Disconnect' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: ANALYTICS ENGINE */}
          {activeTab === 'analytics' && (
            <div className="p-8 max-w-5xl mx-auto space-y-8 w-full" id="analytics-tab-view">
              
              <div className="space-y-2">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded text-xs font-mono uppercase font-bold tracking-wider">
                  ScribeBiz Performance Stats
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">Walkthrough Engagement Analytics</h2>
                <p className="text-sm text-slate-400">
                  Track dynamic viewer retention graphs, drop-off points, call-to-action click-through rates, and estimated support ticket reduction multipliers over client reviews.
                </p>
              </div>

              {/* THREE COLUMN SUMMARY HERO */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">TOTAL RETENTION TIME</p>
                  <p className="text-2xl font-black text-white font-mono">1,820 min</p>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">+12.4% vs last week</p>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CTA CONVERSION RATE</p>
                  <p className="text-2xl font-black text-white font-mono">72.4 %</p>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">92 Proposal approvals</p>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">GATED REVENUE GENERATED</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">$4,820.00</p>
                  <p className="text-[10px] text-slate-400 font-mono">Direct Stripe balance</p>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-900 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">SUPPORT TICKETS REDUCED</p>
                  <p className="text-2xl font-black text-white font-mono">3.5 x</p>
                  <p className="text-[10px] text-emerald-400 font-mono">82 hours saved typing SOWs</p>
                </div>

              </div>

              {/* RETENTION CHART AND WATCH PATTERNS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* INTERACTIVE Drop-off SVG curve */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 font-mono">Audience Retention Drop-Off Analysis</h3>
                      <p className="text-[10px] text-slate-500">Selected video: {selectedRecording ? selectedRecording.title : 'No Recording Selected'}</p>
                    </div>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                      Average Completion: 84%
                    </span>
                  </div>

                  {/* CUSTOM DRAWN RETENTION GRAPH */}
                  <div className="relative pt-2">
                    <svg viewBox="0 0 500 150" className="w-full h-40 text-emerald-500 overflow-visible">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
                      <line x1="0" y1="70" x2="500" y2="70" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
                      
                      {/* Graph line and fill */}
                      <path
                        d="M 0 15 Q 120 15, 200 45 T 380 60 T 500 70 L 500 150 L 0 150 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M 0 15 Q 120 15, 200 45 T 380 60 T 500 70"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />

                      {/* Interactive dots representing chapters */}
                      <circle cx="0" cy="15" r="5" fill="#3b82f6" />
                      <text x="5" y="10" fill="#94a3b8" fontSize="8" fontFamily="monospace">0:00 - Intro (100%)</text>

                      <circle cx="200" cy="45" r="5" fill="#f59e0b" />
                      <text x="205" y="40" fill="#94a3b8" fontSize="8" fontFamily="monospace">1:45 - Key Demo (88%)</text>

                      <circle cx="380" cy="60" r="5" fill="#ec4899" />
                      <text x="385" y="55" fill="#94a3b8" fontSize="8" fontFamily="monospace">3:10 - Next Steps (74%)</text>
                    </svg>
                  </div>

                  <p className="text-[10px] font-mono text-slate-500 leading-normal text-center">
                    Audience retention drops off slightly during the pricing brief. Micro-annotation callouts help keep them aligned.
                  </p>
                </div>

                {/* CONVERSION ENGAGEMENT CARD */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="border-b border-slate-900 pb-3">
                    <h3 className="text-xs font-bold text-slate-300 font-mono">Solopreneur Efficiency Matrix</h3>
                    <p className="text-[10px] text-slate-500">Automated versus Manual writing times</p>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>POST-VIDEO BUSINESS WRITING</span>
                        <span className="text-red-400">90 mins manually</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3.5 rounded overflow-hidden border border-slate-900">
                        <div className="bg-red-500 h-full w-[90%]" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>SCRIBEBIZ AI GENERATION TIME</span>
                        <span className="text-emerald-400">4 seconds automatically</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3.5 rounded overflow-hidden border border-slate-900">
                        <div className="bg-emerald-500 h-full w-[5%]" />
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-950/10 rounded-xl border border-indigo-900/20 text-[10px] leading-relaxed text-indigo-300">
                      <strong>AI Summary recommendation:</strong> Your videos automatically compile scope, invoices, and Twitter content, saving you an estimated <strong className="text-white">12.5 consulting hours</strong> each week.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODAL DIALOG: VIDEO RECORDER & TRANSCRIPTION SIMULATOR */}
      {isRecordingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="recording-modal-dialog">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">AI Screen Recorder Sandbox</h3>
              </div>
              <button
                onClick={() => setIsRecordingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Scroll */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* STAGE SELECT TEMPLATE OR WRITE OWN */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">1. Pick a Walkthrough Scenario</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SANDBOX_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => selectSandboxTemplate(tpl.id)}
                      className={`p-2.5 text-left rounded-lg text-xs font-medium border transition ${selectedTemplate === tpl.id ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'}`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => selectSandboxTemplate('custom')}
                    className={`p-2.5 text-left rounded-lg text-xs font-medium border transition ${selectedTemplate === 'custom' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'}`}
                  >
                    📝 Custom Scratchpad
                  </button>
                </div>
              </div>

              {/* HARDWARE CHECKS AND LIVE MICROPHONE CAPTURE */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">2. Hardware / Permissions (Live preview)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Camera / Screen share sandbox preview */}
                  <div className="aspect-video bg-slate-950 rounded-xl border border-slate-855 overflow-hidden relative flex items-center justify-center">
                    {realRecordUrl ? (
                      <video
                        src={realRecordUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (isCameraOn || isRealRecording) ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-contain ${isCameraOn && !isRealRecording ? 'scale-x-[-1]' : ''}`}
                      />
                    ) : (
                      <div className="text-center space-y-1.5 p-4 text-slate-600">
                        <VideoOff className="w-8 h-8 mx-auto opacity-45" />
                        <p className="text-[10px] font-mono">Video Preview Offline</p>
                      </div>
                    )}
                    
                    {/* Live indicator tag overlay */}
                    {isRealRecording ? (
                      <span className="absolute top-2 left-2 bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse font-mono uppercase">
                        Recording Real Screen
                      </span>
                    ) : isCameraOn && !realRecordUrl ? (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse font-mono uppercase">
                        Camera Feed Live
                      </span>
                    ) : realRecordUrl ? (
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                        Playback Ready
                      </span>
                    ) : null}
                  </div>

                  {/* Mic / Screen share layout */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1"><Mic className="w-4 h-4 text-emerald-400" /> Microphone Status</span>
                        <span className={isMicOn ? "text-emerald-400" : "text-slate-500"}>{isMicOn ? "Active" : "Muted"}</span>
                      </div>
                      
                      {/* Active green radar animation representing sound waveforms */}
                      <div className="h-6 flex items-end justify-between gap-1 px-1 bg-slate-900 rounded border border-slate-850">
                        {isMicOn ? (
                          [40, 90, 30, 80, 50, 70, 40, 95, 30, 60, 45, 90, 30, 75, 45, 80, 30, 85].map((val, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${val}%` }}
                              className="bg-emerald-500 w-full rounded-sm animate-pulse"
                            />
                          ))
                        ) : (
                          <div className="w-full h-px bg-slate-800 self-center" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-900">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={toggleCamera}
                          className={`flex-1 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 ${isCameraOn ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-slate-900 text-slate-300 border border-slate-800'}`}
                        >
                          {isCameraOn ? 'Turn Camera Off' : 'Enable Camera'}
                        </button>
                        <button
                          type="button"
                          onClick={toggleMic}
                          className={`flex-1 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 ${isMicOn ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-300 border border-slate-800'}`}
                        >
                          {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                        </button>
                      </div>

                      {isRecordingActive ? (
                        <button
                          type="button"
                          onClick={isRealRecording ? stopRealScreenRecording : toggleRecordingActive}
                          className="w-full py-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white animate-pulse"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                          Stop Recording ({formatTime(recordingSeconds)})
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={startRealScreenRecording}
                            className="w-full py-2.5 rounded-lg text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow transition flex items-center justify-center gap-2"
                          >
                            <Video className="w-4 h-4 text-emerald-400" />
                            Record Real Tab / Window
                          </button>
                          
                          <button
                            type="button"
                            onClick={toggleRecordingActive}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                            Use Sandbox Simulation Instead
                          </button>
                        </div>
                      )}

                      {realRecordUrl && (
                        <div className="space-y-2 mt-2">
                          <a
                            href={realRecordUrl}
                            download={`ScribeBiz-Recording-${Date.now()}.webm`}
                            className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 text-center cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Download Video Backup (.webm)
                          </a>

                          <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl space-y-1.5 animate-fade-in">
                            <p className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Walkthrough Captured!
                            </p>
                            <p className="text-[10px] text-slate-300 leading-relaxed">
                              ScribeBiz has processed your real video. Scroll down to review the title & generated text transcript, then click <strong className="text-indigo-300 font-bold">Save Walkthrough & Generate AI Suite</strong> at the bottom. This will add it to your Hub list, sync with the server database, and automatically pop up your client-ready share link!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Beautiful cross-origin secure sandbox workaround widget */}
                {recorderError && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2.5 mt-3 animate-fade-in">
                    <div className="flex items-start gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Browser Security Sandboxing Detected</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Your browser does not allow display capture/screen recording from inside a nested iframe.
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          To record your actual tab/window with microphone transcription, click the <span className="text-white font-bold">Launch Unrestricted Tab</span> button below or use the "Open in new tab" icon at the bottom-right of the preview.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const directUrl = window.location.href;
                          navigator.clipboard.writeText(directUrl);
                          setIsUrlCopied(true);
                          setTimeout(() => setIsUrlCopied(false), 2000);
                        }}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1 transition text-[10px] font-mono font-bold"
                      >
                        {isUrlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                        {isUrlCopied ? "Copied Link!" : "Copy Direct App Link"}
                      </button>

                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-650 hover:bg-indigo-605 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition text-[10px] font-mono font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Launch Unrestricted Tab
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setRecorderError(null);
                          toggleRecordingActive();
                        }}
                        className="bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition text-[10px] font-mono font-bold"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        Fallback: Use Sandbox Simulation
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* METADATA TARGET CLIENT */}
              <form onSubmit={handleProcessRecording} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Video / Brief Title</label>
                    <input
                      type="text"
                      required
                      value={sandboxTitle}
                      onChange={(e) => setSandboxTitle(e.target.value)}
                      placeholder="e.g. Bug review or pricing call"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Target Client Profile</label>
                    <select
                      value={sandboxClient}
                      onChange={(e) => {
                        setSandboxClient(e.target.value);
                        const cl = clients.find(c => c.name === e.target.value);
                        if (cl) setSandboxProject(cl.project);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.name}>{c.name} ({c.company})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 font-bold block">Target Project context</label>
                    <input
                      type="text"
                      value={sandboxProject}
                      onChange={(e) => setSandboxProject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* TRANSCRIPT TEXT AREA */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 font-bold block">Walkthrough spoken words Transcript (Spoken Text)</label>
                  <textarea
                    rows={4}
                    required
                    value={sandboxTranscript}
                    onChange={(e) => setSandboxTranscript(e.target.value)}
                    placeholder="Provide transcription spoken during video or type custom content. Speak about bugs, code tables, pricing or SOP tutorials to see smart models parse details!"
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* FOOTER ACTION BUTTONS */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRecordingModalOpen(false)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 transition"
                  >
                    Cancel
                  </button>
                   <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI Neural Parsing Walkthrough...
                      </>
                    ) : realRecordUrl ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Save Walkthrough & Generate AI Suite
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Generate AI Business Suite
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>

          </div>
        </div>
      )}

      {/* MODAL DIALOG: SHARE WORKSPACE SUCCESS */}
      {showShareSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="share-success-modal">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-sans">Walkthrough Client Link Generated!</h3>
              <p className="text-xs text-slate-400">
                ScribeBiz AI successfully published this client hub to a secure, public delivery workspace. Clients can now view the interactive video demo, post timestamped comments, react with emojis, and sign off SOW deliverables.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-350 font-mono truncate select-all flex-1">
                {sharedLinkUrl || "Generating link..."}
              </span>
              <button
                onClick={() => {
                  if (sharedLinkUrl) {
                    navigator.clipboard.writeText(sharedLinkUrl);
                    setIsUrlCopied(true);
                    setTimeout(() => setIsUrlCopied(false), 2000);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 font-mono"
              >
                {isUrlCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={sharedLinkUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 font-mono"
              >
                Open Share View <ExternalLink className="w-3.5 h-3.5" />
              </a>
              
              <button
                type="button"
                onClick={() => setShowShareSuccessModal(false)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
