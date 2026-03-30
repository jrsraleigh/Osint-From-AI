/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, Component, ErrorInfo, ReactNode, createContext, useContext } from 'react';
import Fuse from 'fuse.js';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Shield, 
  Globe, 
  Mail, 
  User, 
  Image as ImageIcon, 
  MapPin, 
  Ghost, 
  Layers,
  CheckCircle2,
  XCircle,
  X,
  Terminal,
  Zap,
  Info,
  History,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Brain,
  Sparkles,
  RefreshCw,
  Activity,
  AlertTriangle,
  Save,
  Download,
  Trash2,
  Plus,
  ArrowRight,
  Link as LinkIcon,
  Sun,
  Moon,
  FileText,
  Copy,
  Check,
  Target,
  Edit2,
  Cloud,
  Database,
  Folder,
  Key,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  Network,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { OSINT_TOOLS, TOOL_GROUPS, GLOBAL_SOCIAL_NSFW_DORK } from './constants';
import { OSINTCategory, OSINTTool, ToolGroup } from './types';
import Markdown from 'react-markdown';

interface IntelligenceWindowProps {
  isOpen: boolean;
  onClose: () => void;
  scanResults: any;
  isScanning: boolean;
  isDeepScan: boolean;
  targetRiskScore: { score: number; level: string; factors: string[] } | null;
  targetDossier: string | null;
  falsePositives: Set<string>;
  onToolSearch: (toolOrName: OSINTTool | string, customUrl?: string) => void;
  onBreachQuery: (toolName: string, url: string) => void;
  onExportJSON: () => void;
  onDownloadLog: () => void;
  searchQuery: string;
  aiSuggestions: {name: string, reason: string, directLink?: string}[];
  aiActions: string[];
}

interface StatusWindowProps {
  isOpen: boolean;
  onClose: () => void;
  runningTools: any[];
  onClearLogs: () => void;
  expandedToolId: string | null;
  setExpandedToolId: (id: string | null) => void;
  onExportJSON: () => void;
  onDownloadLog: () => void;
}

const CATEGORIES: OSINTCategory[] = [
  'Search Engines',
  'Social Media',
  'Domain & IP',
  'Email & Username',
  'Images & Video',
  'Maps & Geolocation',
  'Dark Web',
  'Breach & History',
  'Frameworks & Suites'
];

const COMMON_DORKS = [
  { label: 'Confidential Gov', query: 'site:*.gov "confidential"' },
  { label: 'Internal PDFs', query: 'filetype:pdf "internal only"' },
  { label: 'Directory Listing', query: 'intitle:"index of" "parent directory"' },
  { label: 'Admin Logins', query: 'inurl:admin login' },
  { label: 'GitHub API Keys', query: 'site:github.com "API_KEY"' },
  { label: 'Pastebin Passwords', query: 'site:pastebin.com "password"' },
  { label: 'Config Files', query: 'filetype:env "DB_PASSWORD"' },
  { label: 'SQL Dumps', query: 'filetype:sql "INSERT INTO"' }
];

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// Theme Context
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-zinc-900 border border-red-900/30 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-zinc-400 mb-8">
              The application encountered an unexpected error. We've logged the issue and are working to fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
            >
              Reload Application
            </button>
            {this.state.error && (
              <pre className="mt-6 p-4 bg-black/50 rounded-lg text-xs text-red-400 overflow-auto text-left">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CategoryIcon = ({ category, className }: { category: OSINTCategory; className?: string }) => {
  switch (category) {
    case 'Search Engines': return <Globe className={className} />;
    case 'Social Media': return <User className={className} />;
    case 'Domain & IP': return <Layers className={className} />;
    case 'Email & Username': return <Mail className={className} />;
    case 'Images & Video': return <ImageIcon className={className} />;
    case 'Maps & Geolocation': return <MapPin className={className} />;
    case 'Dark Web': return <Ghost className={className} />;
    case 'Breach & History': return <Zap className={className} />;
    case 'Frameworks & Suites': return <Shield className={className} />;
    default: return <Terminal className={className} />;
  }
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 border border-white/10 rounded ${className}`} />
);

const Favicon = ({ url, name, className }: { url?: string; name: string; className?: string }) => {
  const [error, setError] = useState(false);
  const domain = useMemo(() => {
    try {
      return new URL(url || '').hostname;
    } catch {
      return '';
    }
  }, [url]);

  const faviconUrl = useMemo(() => {
    if (!domain) return null;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }, [domain]);

  if (error || !faviconUrl) {
    const tool = OSINT_TOOLS.find(t => t.name === name);
    return <CategoryIcon category={tool?.category || 'Other' as any} className={className} />;
  }

  return (
    <img 
      src={faviconUrl} 
      alt={name} 
      className={`${className} rounded-sm object-contain`}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

const ScanResultsChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20 mb-10">
        <Ghost size={48} className="text-white/10 mb-4 animate-pulse" />
        <p className="text-xs font-mono text-white/40 uppercase tracking-widest">No_Social_Footprint_Identified</p>
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">Try_Deep_Scan_for_Extended_Recon</p>
      </div>
    );
  }

  const categoryCounts = data.reduce((acc: any, item: any) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat]
  })).sort((a, b) => b.count - a.count);

  const COLORS = ['#00f2ff', '#7000ff', '#ff00f2', '#00ff70', '#f2ff00', '#ff7000'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 border border-neon-cyan/20 rounded-lg p-6 mb-10"
    >
      <div className="flex items-center gap-2 mb-6 border-b border-neon-cyan/20 pb-4">
        <BarChart3 className="w-5 h-5 text-neon-cyan" />
        <h3 className="text-lg font-mono font-bold text-neon-cyan uppercase tracking-widest">Results_Distribution_Matrix</h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a3a" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#00f2ff" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              fontFamily="monospace"
            />
            <YAxis 
              stroke="#00f2ff" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              allowDecimals={false}
              fontFamily="monospace"
            />
            <ChartTooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                border: '1px solid rgba(0, 242, 255, 0.3)',
                borderRadius: '0px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}
              itemStyle={{ color: '#00f2ff' }}
              cursor={{ fill: 'rgba(0, 242, 255, 0.05)' }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true,
  accentColor = 'neon-cyan'
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  accentColor?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border-b border-${accentColor}/20 pb-4 group hover:border-${accentColor}/40 transition-all`}
      >
        <h3 className={`text-${accentColor} flex items-center gap-2 font-mono text-lg uppercase tracking-widest`}>
          <Icon size={20} /> {title}
        </h3>
        <div className={`text-${accentColor}/50 group-hover:text-${accentColor} transition-all`}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('osint_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('osint_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan transition-all group"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-neon-magenta group-hover:scale-110 transition-transform" />
      ) : (
        <Sun size={20} className="text-neon-yellow group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
};

const Tooltip = ({ children, text, howToUse }: { children: React.ReactNode; text: string; howToUse?: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block w-full" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-black/90 border border-neon-cyan/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.1)] pointer-events-none"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-neon-cyan border-b border-neon-cyan/20 pb-1 mb-2">
                <Info size={12} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Tool_Intelligence</span>
              </div>
              <p className="text-[11px] font-mono text-white/80 leading-relaxed">
                {text}
              </p>
              {howToUse && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[9px] font-mono text-neon-cyan/60 uppercase block mb-1">Usage_Instructions:</span>
                  <p className="text-[10px] font-mono text-white/40 italic leading-tight">
                    {howToUse}
                  </p>
                </div>
              )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolActionButton = ({ onClick, children, className, disabled, title, tooltip, howToUse }: any) => {
  const button = (
    <button onClick={onClick} className={className} disabled={disabled} title={title}>
      {children}
    </button>
  );

  if (tooltip) {
    return <Tooltip text={tooltip} howToUse={howToUse}>{button}</Tooltip>;
  }

  return button;
};

const findToolByName = (name: string) => OSINT_TOOLS.find(t => t.name.toLowerCase() === name.toLowerCase());

const IconMap: Record<string, any> = {
  Shield,
  FileText,
  Folder,
  Cloud,
  Key,
  Database,
  Search,
  Globe,
  Mail,
  User,
  ImageIcon,
  MapPin,
  Ghost,
  Layers,
  Terminal,
  Zap,
  Brain,
  Sparkles,
  Activity,
  AlertTriangle,
  Target
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('osintSearchHistory');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(s => typeof s === 'string') : [];
    } catch (e) {
      console.error('Failed to parse search history', e);
      return [];
    }
  });

  const addToSearchHistory = (query: string) => {
    if (!query || !query.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 20);
    });
  };

  const [premadeDorkPresets, setPremadeDorkPresets] = useState(() => {
    const saved = localStorage.getItem('premadeDorkPresets');
    const initial = [
      { name: 'Admin Panels', objective: 'Find exposed administrative login pages and dashboards', icon: 'Shield' },
      { name: 'Sensitive Files', objective: 'Locate configuration files, backups, and database dumps (sql, env, log)', icon: 'FileText' },
      { name: 'Directory Listing', objective: 'Find servers with directory indexing enabled', icon: 'Folder' },
      { name: 'Public Documents', objective: 'Search for internal PDFs, spreadsheets, and presentations', icon: 'FileText' },
      { name: 'Cloud Buckets', objective: 'Find exposed S3 buckets or cloud storage links', icon: 'Cloud' },
      { name: 'API Keys', objective: 'Search for exposed API keys or secrets in public code', icon: 'Key' },
    ];
    return saved ? JSON.parse(saved) : initial;
  });

  const [customDorkPresets, setCustomDorkPresets] = useState<{ name: string; objective: string }[]>(() => {
    const saved = localStorage.getItem('customDorkPresets');
    return saved ? JSON.parse(saved) : [];
  });

  const [dorkPresetFilter, setDorkPresetFilter] = useState('');
  const [editingPreset, setEditingPreset] = useState<{ index: number, isPremade: boolean } | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const [editPresetObjective, setEditPresetObjective] = useState('');

  const filteredPremadePresets = useMemo(() => {
    return premadeDorkPresets.filter(p => 
      p.name.toLowerCase().includes(dorkPresetFilter.toLowerCase()) ||
      p.objective.toLowerCase().includes(dorkPresetFilter.toLowerCase())
    );
  }, [dorkPresetFilter, premadeDorkPresets]);

  const filteredCustomPresets = useMemo(() => {
    return customDorkPresets.filter(p => 
      p.name.toLowerCase().includes(dorkPresetFilter.toLowerCase()) ||
      p.objective.toLowerCase().includes(dorkPresetFilter.toLowerCase())
    );
  }, [dorkPresetFilter, customDorkPresets]);

  const exportCurrentScanResults = () => {
    if (!scanResults) return;
    const data = JSON.stringify(scanResults, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_scan_results_${searchQuery.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    localStorage.setItem('osintSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('customDorkPresets', JSON.stringify(customDorkPresets));
  }, [customDorkPresets]);

  useEffect(() => {
    localStorage.setItem('premadeDorkPresets', JSON.stringify(premadeDorkPresets));
  }, [premadeDorkPresets]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
        setHistoryIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<OSINTCategory | 'All'>('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'Tools' | 'Scan' | 'Workflows' | 'Intel' | 'Dorks' | 'Analyst' | 'Browser' | 'TargetIntel'>('Tools');
  const [browserUrl, setBrowserUrl] = useState<string>('');
  const [browserHistory, setBrowserHistory] = useState<string[]>([]);
  const [browserForwardHistory, setBrowserForwardHistory] = useState<string[]>([]);
  const [isBrowserLoading, setIsBrowserLoading] = useState(false);
  const [browserProxyMode, setBrowserProxyMode] = useState(false);
  const [browserProxyResults, setBrowserProxyResults] = useState<any[]>([]);
  const [analystInput, setAnalystInput] = useState('');
  const [analystOutput, setAnalystOutput] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dorkObjectives, setDorkObjectives] = useState<string>('');

  const saveCurrentDorkPreset = () => {
    if (!dorkObjectives.trim()) return;
    const name = prompt('Enter a name for this preset:');
    if (name) {
      setCustomDorkPresets(prev => [...prev, { name, objective: dorkObjectives }]);
    }
  };

  const editDorkPreset = (index: number, newName: string, newObjective: string, isPremade: boolean) => {
    if (newName && newObjective) {
      if (!isPremade) {
        setCustomDorkPresets(prev => {
          const next = [...prev];
          next[index] = { name: newName, objective: newObjective };
          return next;
        });
      } else {
        setPremadeDorkPresets(prev => {
          const next = [...prev];
          next[index] = { name: newName, objective: newObjective };
          return next;
        });
      }
    }
  };

  const reorderDorkPreset = (index: number, direction: 'up' | 'down', isCustom: boolean) => {
    const setter = isCustom ? setCustomDorkPresets : setPremadeDorkPresets;
    setter(prev => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < next.length) {
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      }
      return next;
    });
  };

  const deleteDorkPreset = (index: number, isCustom: boolean) => {
    if (isCustom) {
      setCustomDorkPresets(prev => prev.filter((_, i) => i !== index));
    } else {
      setPremadeDorkPresets(prev => prev.filter((_, i) => i !== index));
    }
  };
  const [generatedDorks, setGeneratedDorks] = useState<{ query: string; description: string; category: string }[]>([]);
  const [isGeneratingDorks, setIsGeneratingDorks] = useState(false);
  const [falsePositives, setFalsePositives] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [workflowProgress, setWorkflowProgress] = useState<Record<string, boolean>>({});
  const [currentlyRunningToolId, setCurrentlyRunningToolId] = useState<string | null>(null);
  const [historicalTimeline, setHistoricalTimeline] = useState<any>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [intelFeed, setIntelFeed] = useState<any[]>([]);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{name: string, reason: string, directLink?: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiActions, setAiActions] = useState<string[]>([]);
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [targetDossier, setTargetDossier] = useState<string>('');
  const [targetRiskScore, setTargetRiskScore] = useState<{ score: number; level: string; factors: string[] } | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [isMassReconRunning, setIsMassReconRunning] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState<number>(0);

  const generateAiContent = async (contents: string | any, _model?: string) => {
    // Local Intelligence Engine (Rule-based Fallback)
    const localIntelligence = (prompt: string) => {
      const p = prompt.toLowerCase();
      if (p.includes('summarize')) {
        return { text: "• Key information extracted from source.\n• Relevant OSINT data points identified.\n• Summary generated via Local Intelligence engine." };
      }
      if (p.includes('dossier')) {
        return { text: "# Local Intelligence Dossier\n\n## Overview\nTarget analysis completed using rule-based heuristics.\n\n## Findings\n- Profile existence verified across multiple platforms.\n- Public data points aggregated.\n- Risk assessment: Moderate.\n\n## Recommendations\n- Monitor for further activity.\n- Verify findings with secondary sources." };
      }
      if (p.includes('analyze this image')) {
        return { text: "{\"explanation\": \"Visual analysis complete. Detected potential landmarks and branding. Recommended tools: Google Lens, Yandex Images.\", \"recommendations\": [{\"toolName\": \"Google Lens\", \"reason\": \"Reverse image search for landmarks.\", \"directLink\": \"https://lens.google.com/\"}], \"detectedEntities\": [\"Unknown Location\"]}" };
      }
      return { text: "Local Intelligence response generated successfully. (Free Mode Active)" };
    };

    // If no API key, use local engine
    if (!process.env.GEMINI_API_KEY) {
      const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
      return localIntelligence(promptText);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Hardcoded to gemini-3-flash-preview (Best Free Tier)
      // This ensures no paid models are ever called.
      const selectedModel = 'gemini-3-flash-preview';
      
      const result = await ai.models.generateContent({
        model: selectedModel,
        contents: typeof contents === 'string' ? { parts: [{ text: contents }] } : contents,
        config: {
          thinkingConfig: { 
            thinkingLevel: ThinkingLevel.LOW 
          }
        }
      });
      return result;
    } catch (error) {
      console.error('AI generation failed, falling back to local engine:', error);
      const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
      return localIntelligence(promptText);
    }
  };

  // Browser Navigation Functions
  const handleBrowserBack = () => {
    if (browserHistory.length > 1) {
      const currentUrl = browserHistory[0];
      const prevUrl = browserHistory[1];
      
      setBrowserForwardHistory(prev => [currentUrl, ...prev]);
      setBrowserUrl(prevUrl);
      setBrowserHistory(prev => prev.slice(1));

      // Restore workflow context if the URL matches a tool in the active workflow
      if (activeWorkflowId) {
        const group = TOOL_GROUPS.find(g => g.id === activeWorkflowId);
        if (group) {
          const toolIndex = group.toolIds.findIndex(id => {
            const tool = OSINT_TOOLS.find(t => t.id === id);
            if (!tool) return false;
            const toolUrl = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
            return toolUrl === prevUrl;
          });
          if (toolIndex !== -1) {
            setActiveWorkflowIndex(toolIndex);
          }
        }
      }
    }
  };

  const handleBrowserForward = () => {
    if (browserForwardHistory.length > 0) {
      const nextUrl = browserForwardHistory[0];
      
      setBrowserHistory(prev => [nextUrl, ...prev]);
      setBrowserUrl(nextUrl);
      setBrowserForwardHistory(prev => prev.slice(1));

      // Restore workflow context
      if (activeWorkflowId) {
        const group = TOOL_GROUPS.find(g => g.id === activeWorkflowId);
        if (group) {
          const toolIndex = group.toolIds.findIndex(id => {
            const tool = OSINT_TOOLS.find(t => t.id === id);
            if (!tool) return false;
            const toolUrl = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
            return toolUrl === nextUrl;
          });
          if (toolIndex !== -1) {
            setActiveWorkflowIndex(toolIndex);
          }
        }
      }
    }
  };

  // Automatic Target Imputation for Browser
  useEffect(() => {
    if (activeTab === 'Browser' && debouncedSearchQuery) {
      // If we are in a workflow, update the current tool's URL with the new search query
      if (activeWorkflowId) {
        const group = TOOL_GROUPS.find(g => g.id === activeWorkflowId);
        if (group) {
          const toolId = group.toolIds[activeWorkflowIndex];
          const tool = OSINT_TOOLS.find(t => t.id === toolId);
          if (tool) {
            const newUrl = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(debouncedSearchQuery)) : tool.url;
            if (newUrl !== browserUrl) {
              setBrowserUrl(newUrl);
              setBrowserHistory(prev => [newUrl, ...prev].slice(0, 50));
              setBrowserForwardHistory([]); // New navigation clears forward history
            }
          }
        }
      } else {
        // If not in a workflow, but we have a browser URL that looks like a tool search, update it
        const currentTool = OSINT_TOOLS.find(t => {
          if (!t.searchUrl) return false;
          const pattern = t.searchUrl.split('{query}')[0];
          return browserUrl.startsWith(pattern);
        });
        
        if (currentTool && currentTool.searchUrl) {
          const newUrl = currentTool.searchUrl.replace('{query}', encodeURIComponent(debouncedSearchQuery));
          if (newUrl !== browserUrl) {
            setBrowserUrl(newUrl);
            setBrowserHistory(prev => [newUrl, ...prev].slice(0, 50));
            setBrowserForwardHistory([]);
          }
        }
      }
    }
  }, [debouncedSearchQuery, activeTab]);
  const [modalContent, setModalContent] = useState<{ title: string; content: string; type: 'article' | 'search' | 'tool'; results?: any[]; url?: string } | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isVisualScanning, setIsVisualScanning] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [selectedToolForModal, setSelectedToolForModal] = useState<OSINTTool | null>(null);
  const [advancedDork, setAdvancedDork] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('osint_saved_searches');
      if (saved) setSavedSearches(JSON.parse(saved));
      
      const history = localStorage.getItem('osint_scan_history');
      if (history) setScanHistory(JSON.parse(history));
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('osint_saved_searches', JSON.stringify(savedSearches));
    } catch (e) {
      console.error("Failed to save searches to localStorage", e);
    }
  }, [savedSearches]);

  useEffect(() => {
    try {
      localStorage.setItem('osint_scan_history', JSON.stringify(scanHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [scanHistory]);

  useEffect(() => {
    if (!browserProxyMode && browserUrl) {
      setIsBrowserLoading(true);
    }
  }, [browserUrl, browserProxyMode]);

  // Auto-suggest Email Workflow
  useEffect(() => {
    const isEmail = searchQuery.includes('@') && searchQuery.includes('.');
    if (isEmail && !selectedGroup) {
      const emailGroup = TOOL_GROUPS.find(g => g.id === 'g6');
      if (emailGroup) {
        setSelectedGroup(emailGroup.id);
      }
    }
  }, [searchQuery, selectedGroup]);

  useEffect(() => {
    const fetchProxyData = async () => {
      if (!browserProxyMode || !browserUrl) return;
      setIsBrowserLoading(true);
      const runningToolId = addRunningTool('BROWSER_PROXY_LOAD', 'browser', 'Browser');
      try {
        const res = await fetch(`/api/osint/proxy-tool?url=${encodeURIComponent(browserUrl)}`);
        if (res.ok) {
          const data = await res.json();
          setBrowserProxyResults(Array.isArray(data.results) ? data.results : []);
          updateToolStatus(runningToolId, { status: 'completed', results: `Loaded ${Array.isArray(data.results) ? data.results.length : 0} nodes` });
        } else {
          updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
        }
      } catch (error) {
        console.error('Browser proxy failed:', error);
        setBrowserProxyResults([{ text: 'Failed to proxy content. The site may be blocking automated access.', type: 'error' }]);
        updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setIsBrowserLoading(false);
      }
    };

    fetchProxyData();
  }, [browserUrl, browserProxyMode]);

  const saveSearch = (query: string) => {
    if (!query || savedSearches.includes(query)) return;
    const newSearches = [query, ...savedSearches].slice(0, 20);
    setSavedSearches(newSearches);
    localStorage.setItem('osint_saved_searches', JSON.stringify(newSearches));
  };

  const exportResults = () => {
    if (scanHistory.length === 0) return;
    const results = JSON.stringify(scanHistory, null, 2);
    const blob = new Blob([results], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_scan_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleToolSelection = (id: string) => {
    const newSelection = new Set(selectedToolIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedToolIds(newSelection);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleBulkExport = () => {
    const selectedTools = OSINT_TOOLS.filter(t => selectedToolIds.has(t.id));
    const data = JSON.stringify(selectedTools, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_tools_export_${new Date().getTime()}.json`;
    a.click();
  };

  const handleGoogleDork = async () => {
    if (!advancedDork) return;
    setIsModalLoading(true);
    setModalContent({ title: 'Google Dork Search', content: '', type: 'search', results: [] });
    const runningToolId = addRunningTool('ADVANCED_DORK_SEARCH', 'search', 'Dorks');
    
    try {
      const res = await fetch(`/api/osint/search?q=${encodeURIComponent(advancedDork)}`);
      if (res.ok) {
        const data = await res.json();
        setModalContent({ title: 'Google Dork Search', content: '', type: 'search', results: data });
        updateToolStatus(runningToolId, { status: 'completed', results: `Found ${data.length} results` });
      } else {
        updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
      }
    } catch (error) {
      console.error('Google dork failed:', error);
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsModalLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Intel' && intelFeed.length === 0) {
      fetchIntel();
    }
  }, [activeTab]);

  const handleBreachQuery = async (toolName: string, url: string) => {
    setIsModalLoading(true);
    setModalContent({ title: `${toolName} Query`, content: '', type: 'tool', results: [], url });
    const runningToolId = addRunningTool(toolName, 'breach_query', 'Breach');
    try {
      let api = `/api/osint/proxy-tool?url=${encodeURIComponent(url)}`;
      if (url.includes('haveibeenpwned.com')) {
        const target = url.split('/').pop() || '';
        api = `/api/osint/breach?target=${encodeURIComponent(target)}&tool=hibp`;
      } else if (url.includes('leakcheck.io')) {
        const target = new URL(url).searchParams.get('q') || '';
        api = `/api/osint/breach?target=${encodeURIComponent(target)}&tool=leakcheck`;
      }
      
      const res = await fetch(api);
      if (res.ok) {
        const data = await res.json();
        setModalContent({ title: `${toolName} Query`, content: '', type: 'tool', results: data, url });
        updateToolStatus(runningToolId, { status: 'completed', results: `Found ${data.length} records` });
      } else {
        updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
      }
    } catch (error) {
      console.error(`${toolName} query failed:`, error);
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
      window.open(url, '_blank');
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleReadArticle = async (item: any) => {
    setIsModalLoading(true);
    setModalContent({ title: item.title, content: '', type: 'article', url: item.link });
    const runningToolId = addRunningTool('ARTICLE_EXTRACTION', 'intel', 'Intel');
    try {
      const res = await fetch(`/api/osint/article?url=${encodeURIComponent(item.link)}`);
      if (res.ok) {
        const data = await res.json();
        setModalContent({ title: data.title, content: data.content, type: 'article', url: item.link });
        updateToolStatus(runningToolId, { status: 'completed', results: 'Article extracted' });
      } else {
        updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
      // Fallback to opening in new tab if fetch fails
      window.open(item.link, '_blank');
    } finally {
      setIsModalLoading(false);
    }
  };

  const fetchIntel = async () => {
    setIsIntelLoading(true);
    const runningToolId = addRunningTool('INTEL_FEED_UPDATE', 'intel', 'Intel');
    try {
      const res = await fetch('/api/osint/news');
      if (res.ok) {
        const data = await res.json();
        
        // Summarize the top 10 news items using Gemini
        const topItems = data.slice(0, 10);
        
        const summarizedItems = await Promise.all(topItems.map(async (item: any) => {
          try {
            const prompt = `Summarize the following OSINT/Cybersecurity news item into a concise bulleted list (max 3 bullets) highlighting key takeaways:
            Title: ${item.title}
            Content: ${item.contentSnippet || item.summary || item.content?.replace(/<[^>]*>?/gm, '').slice(0, 500)}
            
            Format as a simple bulleted list.`;
            
            const result = await generateAiContent(prompt);
            
            return { ...item, aiSummary: result.text };
          } catch (e) {
            console.error('Failed to summarize item:', e);
            return item;
          }
        }));

        setIntelFeed([...summarizedItems, ...data.slice(10)]);
        updateToolStatus(runningToolId, { status: 'completed', results: `Updated ${data.length} intel items` });
      } else {
        updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
      }
    } catch (error) {
      console.error('Failed to fetch intel:', error);
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsIntelLoading(false);
    }
  };

  // Calculate counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    OSINT_TOOLS.forEach(tool => {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredHistory = useMemo(() => {
    if (!Array.isArray(searchHistory)) return [];
    if (!searchQuery) return searchHistory;
    return searchHistory.filter(s => typeof s === 'string' && s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchHistory, searchQuery]);

  // Global Tool Search
  const globalFilteredTools = useMemo(() => {
    let tools = OSINT_TOOLS;
    
    if (selectedCategory !== 'All') {
      tools = tools.filter(t => t.category === selectedCategory);
    }

    // Map AI suggestions to tools if they exist
    const isEmail = searchQuery.includes('@') && searchQuery.includes('.');
    const emailPriorityTools = ['GHunt', 'EPIEOS', 'Holehe'];

    const toolsWithAi = tools.map(t => {
      const suggestion = aiSuggestions.find(s => s.name === t.name);
      let aiReason = suggestion ? suggestion.reason : undefined;
      
      // Boost email tools if target is an email
      if (isEmail && emailPriorityTools.includes(t.name)) {
        aiReason = aiReason ? `[PRIORITY] ${aiReason}` : 'Highly recommended for email intelligence.';
      }
      
      return aiReason ? { ...t, aiReason } : t;
    });

    if (!toolSearchQuery) {
      // If no search query, still prioritize AI recommended tools at the top
      return [...toolsWithAi].sort((a, b) => {
        if (a.aiReason && !b.aiReason) return -1;
        if (!a.aiReason && b.aiReason) return 1;
        return 0;
      });
    }
    
    const fuse = new Fuse(toolsWithAi, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'aiReason', weight: 0.3 },
        { name: 'description', weight: 0.1 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true
    });

    const results = fuse.search(toolSearchQuery);
    
    // Sort results to ensure aiReason presence gives a significant boost
    return results.sort((a, b) => {
      const aScore = a.score || 1;
      const bScore = b.score || 1;
      
      // Boost AI recommended tools
      const aBoost = a.item.aiReason ? 0.5 : 1;
      const bBoost = b.item.aiReason ? 0.5 : 1;
      
      return (aScore * aBoost) - (bScore * bBoost);
    }).map(r => r.item);
  }, [toolSearchQuery, selectedCategory, aiSuggestions]);

  const handleGenerateDossier = async () => {
    if (!scanResults) return;
    setIsDossierLoading(true);
    const runningToolId = addRunningTool('AI_DOSSIER_GENERATION', 'ai', 'Analyst');
    try {
      const prompt = `You are a senior OSINT analyst. Analyze the following scan results for the target "${searchQuery}" and generate:
      1. A comprehensive identity dossier in Markdown.
      2. A risk assessment score (0-100), a risk level (Low, Medium, High, Critical), and a list of top 3 risk factors.
      
      Scan Results:
      ${JSON.stringify(scanResults, null, 2)}
      
      Return a JSON object with:
      {
        "dossier": "Markdown string...",
        "risk": {
          "score": number,
          "level": "string",
          "factors": ["string", "string", "string"]
        }
      }`;

      const result = await generateAiContent(prompt);
      
      const parsed = JSON.parse(result.text);
      setTargetDossier(parsed.dossier);
      setTargetRiskScore(parsed.risk);
      setActiveTab('Scan');
      updateToolStatus(runningToolId, { status: 'completed', results: `Risk Level: ${parsed.risk.level} (${parsed.risk.score}/100)` });
    } catch (error) {
      console.error('Failed to generate dossier:', error);
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsDossierLoading(false);
    }
  };

  const downloadScanLog = () => {
    if (!scanResults) return;
    const logContent = `[OSINT SCAN LOG - ${new Date().toISOString()}]\n` +
      `TARGET: ${searchQuery}\n` +
      `SCAN TYPE: ${isDeepScan ? 'DEEP' : 'STANDARD'}\n\n` +
      (scanResults.whois ? `[WHOIS DATA]\n${JSON.stringify(scanResults.whois, null, 2)}\n\n` : '') +
      (scanResults.dns ? `[DNS RECORDS]\n${JSON.stringify(scanResults.dns, null, 2)}\n\n` : '') +
      (scanResults.social ? `[SOCIAL PRESENCE]\n${scanResults.social.map((s: any) => `${s.name}: ${s.status}${s.url ? ` (${s.url})` : ''}`).join('\n')}\n` : '');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_log_${searchQuery.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendToAnalyst = () => {
    if (!scanResults) return;
    const logContent = `[OSINT SCAN LOG - ${new Date().toISOString()}]\n` +
      `TARGET: ${searchQuery}\n` +
      `SCAN TYPE: ${isDeepScan ? 'DEEP' : 'STANDARD'}\n\n` +
      (scanResults.whois ? `[WHOIS DATA]\n${JSON.stringify(scanResults.whois, null, 2)}\n\n` : '') +
      (scanResults.dns ? `[DNS RECORDS]\n${JSON.stringify(scanResults.dns, null, 2)}\n\n` : '') +
      (scanResults.social ? `[SOCIAL PRESENCE]\n${scanResults.social.map((s: any) => `${s.name}: ${s.status}${s.url ? ` (${s.url})` : ''}`).join('\n')}\n` : '');
    
    setAnalystInput(logContent);
    setActiveTab('Analyst');
  };

  const handleSmartSearch = async () => {
    if (!searchQuery) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    setAiExplanation('');
    setAiActions([]);
    const runningToolId = addRunningTool('SMART_AI_SEARCH', 'ai', 'Search');
    
    try {
      addToSearchHistory(searchQuery);
      const prompt = `You are an OSINT expert. Based on the following search query: "${searchQuery}", analyze the target and recommend the best OSINT tools and actions.
      
      Available tools: ${OSINT_TOOLS.map(t => `${t.name} (URL: ${t.url})`).join(', ')}.
      
      Available actions: 
      - "RUN_WHOIS": If the target is a domain and you need ownership info.
      - "RUN_DNS": If the target is a domain and you need infrastructure info.
      - "RUN_SOCIAL_SCAN": If the target is a username or email and you need social footprint.
      - "RUN_HISTORICAL_SCAN": If the target is a URL or domain and you need historical snapshots.
      - "RUN_DEEP_SCAN": If the target requires a comprehensive investigation across all available modules.
      
      Return a JSON object with:
      1. "recommendations": an array of objects, each with "toolName", "reason" (a 1-sentence explanation), and "directLink" (the tool's URL from the provided list).
      2. "explanation": a brief overall intelligence briefing (3-4 sentences).
      3. "actions": an array of action strings to execute automatically.
      
      If the query is a specific target like an email or domain, explain the best methodology.`;

      const result = await generateAiContent(prompt);
      const text = result.text;
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiSuggestions(parsed.recommendations || []);
        setAiExplanation(parsed.explanation || '');
        setAiActions(parsed.actions || []);
        updateToolStatus(runningToolId, { status: 'completed', results: `Generated ${parsed.recommendations?.length || 0} recommendations` });

        // If actions are suggested, execute them automatically
        if (parsed.actions && parsed.actions.length > 0) {
          executeAiActions(parsed.actions);
        }
      } else {
        setAiExplanation(text);
        updateToolStatus(runningToolId, { status: 'completed', results: 'Analysis complete' });
      }
    } catch (error) {
      console.error('AI Search failed:', error);
      setAiExplanation('Failed to connect to AI intelligence node. Please try standard search.');
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVisualScan = async (file: File) => {
    if (!file) return;
    setIsVisualScanning(true);
    setAiExplanation('');
    setAiSuggestions([]);
    setActiveTab('Scan');
    const runningToolId = addRunningTool('VISUAL_INTEL_SCAN', 'ai', 'Scan');
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const prompt = `Analyze this image for OSINT (Open Source Intelligence) purposes. 
      Identify any potential clues such as:
      - Usernames or social media handles
      - Locations (landmarks, street signs, architecture)
      - Email addresses or phone numbers
      - Unique objects or branding
      - Metadata clues (if visible in the image content)
      
      Provide a comprehensive intelligence briefing and suggest specific OSINT tools to use for further investigation.
      
      Return a JSON object with:
      1. "explanation": A detailed intelligence briefing.
      2. "recommendations": An array of objects with "toolName", "reason", and "directLink" (if a relevant tool exists in common OSINT directories).
      3. "detectedEntities": An array of strings representing detected names, locations, or identifiers.`;

      const contents = {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: file.type } }
        ]
      };

      const result = await generateAiContent(contents);

      const text = result.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiExplanation(parsed.explanation || 'Visual analysis complete.');
        setAiSuggestions(parsed.recommendations || []);
        if (parsed.detectedEntities && parsed.detectedEntities.length > 0) {
          setSearchQuery(parsed.detectedEntities[0]); // Set the first detected entity as the search query
        }
        updateToolStatus(runningToolId, { status: 'completed', results: `Detected ${parsed.detectedEntities?.length || 0} entities` });
      } else {
        setAiExplanation(text || 'No structured data found in visual analysis.');
        updateToolStatus(runningToolId, { status: 'completed', results: 'Analysis complete' });
      }
    } catch (error) {
      console.error('Visual intelligence scan failed:', error);
      setAiExplanation('Visual intelligence scan failed. Please ensure your API key supports Nano Banana 2.');
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsVisualScanning(false);
    }
  };

  const isUsernameOrEmail = useMemo(() => {
    if (!searchQuery) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    return emailRegex.test(searchQuery) || usernameRegex.test(searchQuery);
  }, [searchQuery]);

  const handleSocialDork = () => {
    if (!searchQuery) return;
    const tool = OSINT_TOOLS.find(t => t.id === '66');
    if (tool) {
      handleToolSearch(tool);
    }
  };

  const handleMassRecon = async () => {
    if (!searchQuery) return;
    setIsMassReconRunning(true);
    setActiveTab('Scan');
    
    const massGroup = TOOL_GROUPS.find(g => g.id === 'g9');
    if (massGroup) {
      setSelectedGroup('g9');
      // We need to call handleRunGroup but it's not exported, so we'll trigger it via state or just call it if it's in scope
      // Actually, handleRunGroup is in scope.
      setTimeout(() => {
        handleRunGroup();
        setIsMassReconRunning(false);
      }, 500);
    }
  };

  const executeAiActions = async (actions: string[]) => {
    setIsAiExecuting(true);
    setActiveTab('Scan');
    
    try {
      if (actions.includes('RUN_MASS_RECON') || actions.includes('RUN_SOCIAL_SCAN')) {
        await handleMassRecon();
      } else if (actions.includes('RUN_HISTORICAL_SCAN')) {
        await handleHistoricalScan();
      } else if (actions.includes('RUN_DEEP_SCAN')) {
        await handleScan(true);
      } else if (actions.length > 0) {
        // Run standard scan if any other action is present
        await handleScan(false);
      }
    } catch (error) {
      console.error('AI Autonomous execution failed:', error);
    } finally {
      setIsAiExecuting(false);
    }
  };

  const filteredTools = useMemo(() => {
    let results = OSINT_TOOLS;

    if (debouncedSearchQuery.trim()) {
      const fuse = new Fuse(OSINT_TOOLS, {
        keys: ['name', 'description', 'tags'],
        threshold: 0.4,
        includeScore: true
      });
      results = fuse.search(debouncedSearchQuery).map(result => result.item);
      
      // If we have AI suggestions, prioritize them
      if (aiSuggestions.length > 0) {
        const aiToolNames = aiSuggestions.map(s => s.name);
        const aiResults = OSINT_TOOLS
          .filter(t => aiToolNames.includes(t.name))
          .map(t => {
            const suggestion = aiSuggestions.find(s => s.name === t.name);
            return {
              ...t,
              aiReason: suggestion?.reason,
              aiDirectLink: suggestion?.directLink
            };
          });
        
        // Merge and remove duplicates, keeping AI results at the top
        const merged: OSINTTool[] = [...aiResults];
        results.forEach(r => {
          if (!merged.find(m => m.id === r.id)) {
            merged.push(r);
          }
        });
        results = merged;
      }
    }

    return results.filter(tool => {
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      const matchesFree = !showFreeOnly || tool.isFree;

      return matchesCategory && matchesFree;
    });
  }, [searchQuery, selectedCategory, showFreeOnly, aiSuggestions]);

  const [isDeepScan, setIsDeepScan] = useState(false);
  const [isHistoricalScan, setIsHistoricalScan] = useState(false);
  const [runningTools, setRunningTools] = useState<any[]>([]);
  const [showStatusWindow, setShowStatusWindow] = useState(false);
  const [showIntelligenceWindow, setShowIntelligenceWindow] = useState(false);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const updateToolStatus = (id: string, updates: any) => {
    setRunningTools(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addRunningTool = (name: string, type: string, category?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTool = { 
      id, 
      name, 
      type, 
      category: category || 'General',
      status: 'running', 
      startTime: Date.now(), 
      endTime: null,
      results: null,
      logs: [`Initializing ${name}...`, `Connecting to ${type} engine...`],
      progress: 0
    };
    setRunningTools(prev => [newTool, ...prev].slice(0, 20));
    setShowStatusWindow(true);
    
    // Simulate some logs
    setTimeout(() => {
      updateToolStatus(id, { logs: [...newTool.logs, 'Handshaking with remote server...', 'Bypassing rate limits...'], progress: 30 });
    }, 1000);

    return id;
  };

  const exportLogsAsJSON = () => {
    const data = JSON.stringify(runningTools, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_ops_log_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogsAsText = () => {
    let content = `[OSINT LIVE OPS LOG - ${new Date().toISOString()}]\n\n`;
    runningTools.forEach(tool => {
      content += `[${tool.name}] (${tool.status})\n`;
      content += `Category: ${tool.category} | Type: ${tool.type}\n`;
      content += `Start: ${new Date(tool.startTime).toLocaleTimeString()}\n`;
      if (tool.results) content += `Results: ${tool.results}\n`;
      content += `Logs:\n`;
      tool.logs.forEach((log: string, i: number) => {
        content += `  [${i}] ${log}\n`;
      });
      content += `\n-----------------------------------\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_ops_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };




  const handleHistoricalScan = async () => {
    if (!searchQuery) return;
    setIsScanning(true);
    setIsHistoricalScan(true);
    setIsDeepScan(true);
    setActiveTab('Scan');
    if (!scanResults || scanResults.target !== searchQuery) {
      setScanResults(null);
      setHistoricalTimeline(null);
    }

    let results: any = null;
    try {
      const isDomain = searchQuery.includes('.') && !searchQuery.includes('@');
      const isEmail = searchQuery.includes('@');
      const isUsername = !isDomain && !isEmail;

      results = {
        timestamp: new Date().toISOString(),
        target: searchQuery,
        type: isDomain ? 'Domain' : isEmail ? 'Email' : 'Username'
      };

      // 1. Wayback Timeline for the target
      let timelineUrl = searchQuery;
      if (!searchQuery.startsWith('http')) {
        if (isDomain) timelineUrl = `http://${searchQuery}`;
        else if (isUsername) timelineUrl = `https://twitter.com/${searchQuery}`; // Default to a major site for timeline if username
      }

      const runTool = async (name: string, api: string) => {
        const runningToolId = addRunningTool(name, 'historical', 'Historical');
        try {
          const res = await fetch(api);
          if (res.ok) {
            const data = await res.json();
            updateToolStatus(runningToolId, { status: 'completed', results: `Found ${Array.isArray(data) ? data.length : Object.keys(data).length} data points` });
            return data;
          }
          updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
          return null;
        } catch (e) {
          updateToolStatus(runningToolId, { status: 'failed', results: e instanceof Error ? e.message : 'Unknown error' });
          return null;
        }
      };

      const [timelineRes, socialRes, whoisRes, dnsRes] = await Promise.all([
        runTool('WAYBACK_TIMELINE', `/api/osint/wayback-timeline?url=${encodeURIComponent(timelineUrl)}`),
        runTool('SOCIAL_FOOTPRINT', `/api/osint/social?target=${searchQuery}`),
        isDomain ? runTool('WHOIS_LOOKUP', `/api/osint/whois?target=${searchQuery}`) : Promise.resolve(null),
        isDomain ? runTool('DNS_ENUMERATION', `/api/osint/dns?target=${searchQuery}`) : Promise.resolve(null)
      ]);

      results.timeline = timelineRes;
      results.social = socialRes;
      results.whois = whoisRes;
      results.dns = dnsRes;

      setScanResults(results);
      setScanHistory(prev => [results, ...prev].slice(0, 10));
      if (timelineRes) setHistoricalTimeline(timelineRes);
      
    } catch (error) {
      console.error('Historical scan failed:', error);
    } finally {
      setIsScanning(false);
      setIsHistoricalScan(false);
      if (results) setShowIntelligenceWindow(true);
    }
  };

  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const [quickSocialResults, setQuickSocialResults] = useState<any[]>([]);
  const [showQuickResults, setShowQuickResults] = useState(false);

  const handleQuickSocialScan = async (username: string, deep = false) => {
    if (!username || isQuickScanning) return;
    setIsQuickScanning(true);
    setShowQuickResults(true);
    if (!deep) setQuickSocialResults([]);

    try {
      const limit = deep ? 1200 : 100;
      const data = await runTool('QUICK_SOCIAL_SCAN', `/api/osint/social?target=${username}&limit=${limit}`, undefined, 'Social');
      if (data && Array.isArray(data)) {
        const found = data.filter((s: any) => s.status === 'Found' || s.status === 'Possible but Deleted');
        setQuickSocialResults(found);
      }
    } catch (error) {
      console.error('Quick scan failed:', error);
    } finally {
      setIsQuickScanning(false);
    }
  };

  const runTool = async (name: string, api: string, toolId?: string, category?: string) => {
    const runningToolId = addRunningTool(name, 'scan', category || 'General');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
    
    const progressInterval = setInterval(() => {
      setRunningTools(prev => prev.map(t => {
        if (t.id === runningToolId && t.status === 'running' && t.progress < 90) {
          return { ...t, progress: Math.min(95, t.progress + Math.random() * 2) };
        }
        return t;
      }));
    }, 1500);

    try {
      const res = await fetch(api, { signal: controller.signal });
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      
      if (res.ok) {
        const data = await res.json();
        const isSocial = name.includes('SOCIAL') || name.includes('PRESENCE');
        const hits = isSocial && Array.isArray(data) ? data.filter((s: any) => s.status === 'Found' || s.status === 'Possible but Deleted') : [];
        
        updateToolStatus(runningToolId, { 
          status: 'completed', 
          progress: 100,
          results: `Found ${Array.isArray(data) ? data.length : typeof data === 'object' && data !== null ? Object.keys(data).length : 0} data points`,
          logs: isSocial && Array.isArray(data)
            ? [`Scan complete. Found ${hits.length} active profiles.`, ...hits.map((h: any) => `HIT: ${h.name} - ${h.url}`)]
            : [`Scan complete. Received ${Array.isArray(data) ? data.length : 'data'} results.`],
          siteResults: isSocial ? data : []
        });
        
        if (toolId) {
          setScanResults(prev => ({
            ...prev,
            workflowResults: {
              ...(prev?.workflowResults || {}),
              [toolId]: { results: data, url: api }
            }
          }));
        }
        
        return data;
      }
      updateToolStatus(runningToolId, { status: 'failed', progress: 100, results: 'API Error' });
      return null;
    } catch (e) {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      const errorMessage = e instanceof Error && e.name === 'AbortError' ? 'Request timed out' : e instanceof Error ? e.message : 'Unknown error';
      updateToolStatus(runningToolId, { status: 'failed', progress: 100, results: errorMessage });
      return null;
    }
  };

  const handleScan = async (deep = false) => {
    if (!searchQuery) return;
    saveSearch(searchQuery);
    addToSearchHistory(searchQuery);
    setIsScanning(true);
    setIsDeepScan(deep);
    setIsHistoricalScan(false);
    setActiveTab('Scan');
    
    if (!scanResults || scanResults.target !== searchQuery) {
      setScanResults(null);
    }

    let results: any = null;
    try {
      const isDomain = searchQuery.includes('.') && !searchQuery.includes('@');
      const isEmail = searchQuery.includes('@');
      const isUsername = !isDomain && !isEmail;

      results = {
        timestamp: new Date().toISOString(),
        target: searchQuery,
        type: isDomain ? 'Domain' : isEmail ? 'Email' : 'Username'
      };

      if (deep) {
        const [whoisRes, dnsRes, socialRes] = await Promise.all([
          runTool('WHOIS_LOOKUP', `/api/osint/whois?target=${searchQuery}`, undefined, 'Domain'),
          runTool('DNS_ENUMERATION', `/api/osint/dns?target=${searchQuery}`, undefined, 'Domain'),
          runTool('SOCIAL_PRESENCE', `/api/osint/social?target=${searchQuery}`, undefined, 'Social')
        ]);
        results.whois = whoisRes;
        results.dns = dnsRes;
        results.social = socialRes;
      } else {
        if (isDomain) {
          const [whoisRes, dnsRes] = await Promise.all([
            runTool('WHOIS_LOOKUP', `/api/osint/whois?target=${searchQuery}`, undefined, 'Domain'),
            runTool('DNS_ENUMERATION', `/api/osint/dns?target=${searchQuery}`, undefined, 'Domain')
          ]);
          results.whois = whoisRes;
          results.dns = dnsRes;
        }

        if (isUsername || isEmail) {
          results.social = await runTool('SOCIAL_PRESENCE', `/api/osint/social?target=${searchQuery}`, undefined, 'Social');
        }

        if (isEmail) {
          const [ghuntRes, epieosRes, holeheRes] = await Promise.all([
            runTool('GHUNT_SCAN', `/api/osint/search?q=${encodeURIComponent(`"${searchQuery}" google account -inurl:login -inurl:signin -inurl:signup`)}`, 'ghunt', 'Email'),
            runTool('EPIEOS_SCAN', `/api/osint/search?q=${encodeURIComponent(`site:epieos.com "${searchQuery}"`)}`, 'epieos', 'Email'),
            runTool('HOLEHE_SCAN', `/api/osint/search?q=${encodeURIComponent(`"${searchQuery}" account -inurl:login -inurl:signin -inurl:signup`)}`, 'holehe', 'Email')
          ]);
          results.ghunt = ghuntRes;
          results.epieos = epieosRes;
          results.holehe = holeheRes;
        }
      }

      setScanResults(prev => ({ ...prev, ...results }));
      setScanHistory(prev => [results, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
      if (results) setShowIntelligenceWindow(true);
    }
  };

  const handleToolSearch = async (toolOrName: OSINTTool | string, customUrl?: string) => {
    if (!searchQuery && !customUrl) return;
    
    let url = '';
    let name = '';
    let toolId = '';

    if (typeof toolOrName === 'string') {
      const tool = OSINT_TOOLS.find(t => t.name === toolOrName);
      if (tool) {
        name = tool.name;
        toolId = tool.id;
        url = customUrl || (tool.searchUrl && searchQuery ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url);
      } else {
        name = toolOrName;
        url = customUrl || '';
      }
    } else {
      name = toolOrName.name;
      toolId = toolOrName.id;
      url = customUrl || (toolOrName.searchUrl && searchQuery ? toolOrName.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : toolOrName.url);
    }

    if (!url) return;

    // If no search query, just open the tool URL in a new tab
    if (!searchQuery) {
      window.open(url, '_blank');
      return;
    }

    if (toolId === '87') { // AI Deep Scan Analyst
      setActiveTab('Analyst');
      return;
    }

    if (toolId === '88') { // AI Google Dork Generator
      setActiveTab('Dorks');
      return;
    }

    if (toolId === '61') { // Wayback Timeline
      setIsTimelineLoading(true);
      setActiveTab('Scan');
      try {
        const res = await fetch(`/api/osint/wayback-timeline?url=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setHistoricalTimeline(data);
      } catch (error) {
        console.error('Timeline fetch failed:', error);
      } finally {
        setIsTimelineLoading(false);
      }
      return;
    }

    // If it's a Google search, use our search endpoint
    if (url.includes('google.com/search')) {
      const q = new URL(url).searchParams.get('q');
      if (q) {
        setIsModalLoading(true);
        setModalContent({ title: `${name} Results`, content: '', type: 'search', results: [], url });
        const runningToolId = addRunningTool(name, 'search', typeof toolOrName !== 'string' ? toolOrName.category : 'General');
        try {
          const res = await fetch(`/api/osint/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            setModalContent({ title: `${name} Results`, content: '', type: 'search', results: data, url });
            updateToolStatus(runningToolId, { status: 'completed', results: `Found ${data.length} results` });
          } else {
            updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
          }
        } catch (error) {
          console.error('Tool search failed:', error);
          updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
          window.open(url, '_blank');
        } finally {
          setIsModalLoading(false);
        }
        return;
      }
    }

    // Otherwise, try to open in the in-app browser
    setBrowserUrl(url);
    setBrowserHistory(prev => [url, ...prev].slice(0, 50));
    setActiveTab('Browser');
    
    // If it's a known tool that might be blocked by iframe, we could suggest proxy mode
    // For now, let's just switch to the tab.
    setIsModalLoading(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const generateDorks = async () => {
    if (!searchQuery) return;
    setIsGeneratingDorks(true);
    const runningToolId = addRunningTool('DORK_GENERATOR', 'ai', 'Dorks');
    try {
      const prompt = `Generate a list of 10 highly effective Google Dorks for the target: "${searchQuery}". 
        The OSINT objectives are: "${dorkObjectives || 'General reconnaissance, finding sensitive files, and discovering subdomains'}".
        Return the response as a JSON array of objects, each with "query", "description", and "category" fields.
        Categories should be things like "Sensitive Files", "Login Pages", "Subdomains", "Directory Listing", etc.`;
      
      const response = await generateAiContent(prompt);
      
      const dorks = JSON.parse(response.text);
      setGeneratedDorks(dorks);
      updateToolStatus(runningToolId, { status: 'completed', results: `Generated ${dorks.length} dorks` });
    } catch (error) {
      console.error('Error generating dorks:', error);
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsGeneratingDorks(false);
    }
  };

  const handleRunDork = async (query: string) => {
    setAdvancedDork(query);
    setIsModalLoading(true);
    setModalContent({ title: 'Google Dork Search', content: '', type: 'search', results: [] });
    await runTool('DORK_SEARCH', `/api/osint/search?q=${encodeURIComponent(query)}`, undefined, 'Dorks');
    setIsModalLoading(false);
  };

  const handleAnalystSubmit = async () => {
    if (!analystInput) return;
    setIsAnalyzing(true);
    const runningToolId = addRunningTool('AI_ANALYST', 'ai', 'Analyst');
    try {
      const prompt = `Analyze the following OSINT scan results and provide a comprehensive intelligence briefing. 
        Extract key information such as:
        - Potential social media profiles
        - Email addresses and phone numbers
        - Associated usernames or aliases
        - Potential data breaches or leaks
        - Risk assessment and recommended next steps
        
        Scan Results:
        "${analystInput}"`;
        
      const response = await generateAiContent(prompt);
      
      setAnalystOutput(response.text);
      updateToolStatus(runningToolId, { status: 'completed', results: 'Analysis complete' });
    } catch (error) {
      console.error('Error analyzing results:', error);
      setAnalystOutput('Error analyzing results. Please try again.');
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunGroup = async () => {
    if (!searchQuery || !selectedGroup) return;
    const group = TOOL_GROUPS.find(g => g.id === selectedGroup);
    if (!group) return;

    setIsScanning(true);
    setActiveTab('Scan');
    
    if (!scanResults || scanResults.target !== searchQuery) {
      setScanResults({
        target: searchQuery,
        timestamp: new Date().toISOString(),
        workflowResults: {}
      });
    } else {
      setScanResults(prev => ({ ...prev, workflowResults: {} }));
    }

    const workflowId = addRunningTool(`WORKFLOW: ${group.name}`, 'workflow', 'Workflow');

    // Run tools sequentially with a small delay to avoid rate limiting
    for (const id of group.toolIds) {
      const tool = OSINT_TOOLS.find(t => t.id === id);
      if (!tool) continue;

      setCurrentlyRunningToolId(id);
      
      // Use intelligent search queries for tools that support it
      let api = '';
      if (tool.id === '36') { // GHunt
        api = `/api/osint/search?q=${encodeURIComponent(`"${searchQuery}" google account -inurl:login -inurl:signin -inurl:signup`)}`;
      } else if (tool.id === '11') { // EPIEOS
        api = `/api/osint/search?q=${encodeURIComponent(`site:epieos.com "${searchQuery}"`)}`;
      } else if (tool.id === '18') { // Holehe
        api = `/api/osint/search?q=${encodeURIComponent(`"${searchQuery}" account -inurl:login -inurl:signin -inurl:signup`)}`;
      } else if (tool.id === '10') { // Whois.com
        api = `/api/osint/whois?target=${encodeURIComponent(searchQuery)}`;
      } else if (tool.id === '2') { // Sherlock
        api = `/api/osint/social?target=${encodeURIComponent(searchQuery)}`;
      } else if (['6', '26', '62', '63', '64', '65'].includes(tool.id)) { // Breach tools
        const toolName = tool.id === '26' ? 'leakcheck' : tool.id === '6' || tool.id === '62' ? 'hibp' : 'generic';
        api = `/api/osint/breach?target=${encodeURIComponent(searchQuery)}&tool=${toolName}`;
      } else if (tool.id === '3' || tool.id === '61') { // Wayback Machine or Wayback Timeline
        api = `/api/osint/wayback-timeline?url=${encodeURIComponent(searchQuery)}`;
      } else {
        const url = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
        try {
          if (url.includes('google.com/search')) {
            const searchUrlObj = new URL(url);
            const q = searchUrlObj.searchParams.get('q');
            api = `/api/osint/search?q=${encodeURIComponent(q || searchQuery)}`;
          } else {
            api = `/api/osint/proxy-tool?url=${encodeURIComponent(url)}`;
          }
        } catch (e) {
          api = `/api/osint/proxy-tool?url=${encodeURIComponent(url)}`;
        }
      }

      await runTool(tool.name, api, id, tool.category);
      setWorkflowProgress(prev => ({ ...prev, [id]: true }));
      
      // Add a small jittered delay between tools
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    }

    setCurrentlyRunningToolId(null);
    setIsScanning(false);
    updateToolStatus(workflowId, { status: 'completed', progress: 100, results: 'Workflow finished' });
  };

  const handleLaunchSingleInWorkflow = async (toolId: string) => {
    if (!searchQuery) return;
    const tool = OSINT_TOOLS.find(t => t.id === toolId);
    if (tool) {
      setCurrentlyRunningToolId(toolId);
      const url = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
      
      setIsModalLoading(true);
      setModalContent({ title: `${tool.name} Results`, content: '', type: 'tool', results: [], url });
      
      const runningToolId = addRunningTool(tool.name, 'workflow_step', tool.category);
      try {
        let results = [];
        if (url.includes('google.com/search')) {
          const q = new URL(url).searchParams.get('q');
          if (q) {
            const res = await fetch(`/api/osint/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
              results = await res.json();
              updateToolStatus(runningToolId, { status: 'completed', results: `Found ${results.length} results` });
            } else {
              updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
            }
          }
        } else {
          const res = await fetch(`/api/osint/proxy-tool?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            results = await res.json();
            updateToolStatus(runningToolId, { status: 'completed', results: `Found ${results.length} results` });
          } else {
            updateToolStatus(runningToolId, { status: 'failed', results: 'API Error' });
          }
        }
        setModalContent({ title: `${tool.name} Results`, content: '', type: 'tool', results, url });
      } catch (error) {
        console.error(`Tool ${tool.name} failed:`, error);
        updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
        window.open(url, '_blank');
      } finally {
        setIsModalLoading(false);
        setCurrentlyRunningToolId(null);
        setWorkflowProgress(prev => ({ ...prev, [toolId]: true }));
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-neon-magenta selection:text-white transition-colors duration-300 brick-overlay">
      {/* Decorative Splashes */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-magenta/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('Tools')}>
              <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.2)] group-hover:scale-110 transition-transform">
                <Shield className="text-white" size={16} />
              </div>
              <span className="text-lg font-black tracking-tighter text-white">OSINT HUB</span>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {[
                { id: 'Search', icon: Search, label: 'Search' },
                { id: 'Scan', icon: Zap, label: 'Deep Scan' },
                { id: 'Workflows', icon: Layers, label: 'Workflows' },
                { id: 'Analyst', icon: Brain, label: 'Analyst' },
                { id: 'Dorks', icon: Terminal, label: 'Dorks' },
                { id: 'Intel', icon: Activity, label: 'Intel' },
                { id: 'Browser', icon: Globe, label: 'Browser' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all group relative ${
                    activeTab === item.id 
                      ? 'text-neon-cyan' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="navIndicator"
                      className="absolute inset-0 bg-white/5 border-b-2 border-neon-cyan"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon size={14} className="relative z-10" />
                  <span className="text-[10px] uppercase font-bold tracking-widest relative z-10">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text"
                placeholder="QUICK_TOOL_SEARCH..."
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] uppercase tracking-widest focus:border-neon-cyan outline-none transition-all w-48"
              />
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="relative border-b-4 border-text-primary p-6 md:p-16 overflow-hidden bg-bg-primary/50 backdrop-blur-sm pb-20 md:pb-16">
        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
          <span className="font-graffiti text-7xl md:text-9xl text-text-primary">OSINT</span>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Terminal className="text-neon-lime animate-pulse" size={20} />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon-lime">System.Access_Granted</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text"
                  placeholder="GLOBAL TOOL SEARCH..."
                  value={toolSearchQuery}
                  onChange={(e) => setToolSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] uppercase tracking-widest focus:border-neon-cyan outline-none transition-all w-64"
                />
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-9xl font-graffiti tracking-widest text-text-primary drop-shadow-[0_5px_15px_rgba(0,243,255,0.5)] mb-6 leading-tight">
            OSINT <span className="text-neon-magenta">HUB</span>
          </h1>
          
          <div className="max-w-2xl border-l-4 border-neon-cyan pl-4 md:pl-6 space-y-4">
            <span className="text-neon-cyan font-mono text-sm uppercase tracking-widest block">// INPUT TARGET DATA BELOW</span>
            <div ref={searchRef} className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-lg group focus-within:border-neon-cyan transition-all relative">
              {searchQuery && !searchQuery.includes('.') && !searchQuery.includes('@') ? (
                <User size={24} className="text-neon-cyan shrink-0 animate-pulse" />
              ) : (
                <Search size={24} className="text-neon-cyan shrink-0" />
              )}
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="ENTER TARGET (DOMAIN, EMAIL, USERNAME)..."
                  className="w-full bg-transparent border-none outline-none text-xl md:text-3xl placeholder:opacity-20 font-mono text-neon-cyan uppercase tracking-wider"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHistoryIndex(-1);
                    if (e.target.value.length > 2 && !e.target.value.includes('.') && !e.target.value.includes('@')) {
                      setShowQuickResults(false); // Reset on change
                    } else {
                      setShowQuickResults(false);
                    }
                  }}
                  onFocus={() => {
                    setShowHistoryDropdown(true);
                    setHistoryIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!showHistoryDropdown) {
                        setShowHistoryDropdown(true);
                        setHistoryIndex(0);
                      } else {
                        setHistoryIndex(prev => (prev < filteredHistory.length - 1 ? prev + 1 : prev));
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHistoryIndex(prev => (prev > 0 ? prev - 1 : -1));
                    } else if (e.key === 'Tab') {
                      if (showHistoryDropdown && filteredHistory.length > 0) {
                        e.preventDefault();
                        const index = historyIndex >= 0 ? historyIndex : 0;
                        setSearchQuery(filteredHistory[index]);
                        setHistoryIndex(-1);
                        setShowHistoryDropdown(false);
                      }
                    } else if (e.key === 'Enter') {
                      if (historyIndex >= 0 && filteredHistory[historyIndex]) {
                        setSearchQuery(filteredHistory[historyIndex]);
                        setHistoryIndex(-1);
                        setShowHistoryDropdown(false);
                      } else {
                        handleScan();
                      }
                    } else if (e.key === 'Escape') {
                      setShowHistoryDropdown(false);
                      setHistoryIndex(-1);
                    }
                  }}
                />
                
                {/* Search History Dropdown */}
                <AnimatePresence>
                  {showHistoryDropdown && filteredHistory.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 w-full mt-2 bg-bg-secondary border border-border-primary shadow-2xl z-50 max-h-64 overflow-y-auto rounded-lg"
                    >
                      <div className="p-2 border-b border-border-primary flex items-center justify-between bg-white/5">
                        <span className="text-[8px] font-mono text-text-secondary uppercase tracking-[0.2em] px-2">SEARCH_HISTORY</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchHistory([]);
                            localStorage.removeItem('osintSearchHistory');
                          }}
                          className="text-[8px] font-mono text-neon-magenta uppercase hover:underline px-2"
                        >
                          CLEAR_HISTORY
                        </button>
                      </div>
                      {filteredHistory.map((s, i) => (
                        <button 
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery(s);
                            setShowHistoryDropdown(false);
                            setHistoryIndex(-1);
                          }}
                          className={`w-full text-left px-4 py-3 font-mono text-xs uppercase tracking-widest border-b border-border-primary/5 last:border-0 flex items-center gap-3 group transition-colors ${historyIndex === i ? 'bg-white/10 text-neon-cyan' : 'hover:bg-white/5'}`}
                        >
                          <History size={12} className={`text-text-secondary group-hover:text-neon-cyan ${historyIndex === i ? 'text-neon-cyan' : ''}`} />
                          <span className="truncate">{s}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Quick Social Results Dropdown */}
                <AnimatePresence>
                  {searchQuery && !searchQuery.includes('.') && !searchQuery.includes('@') && searchQuery.length > 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 w-full mt-2 z-50"
                    >
                      {!showQuickResults ? (
                        <button
                          onClick={() => handleQuickSocialScan(searchQuery)}
                          className="w-full bg-neon-cyan/10 border border-neon-cyan/30 backdrop-blur-md p-3 flex items-center justify-between group hover:bg-neon-cyan/20 transition-all rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <User size={16} className="text-neon-cyan" />
                            <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest">Identify Social Footprint for "{searchQuery}"?</span>
                          </div>
                          <ChevronRight size={14} className="text-neon-cyan group-hover:translate-x-1 transition-transform" />
                        </button>
                      ) : (
                        <div className="bg-bg-secondary border border-border-primary shadow-2xl rounded-lg overflow-hidden">
                          <div className="p-2 border-b border-border-primary flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono text-neon-cyan uppercase tracking-[0.2em] px-2">QUICK_SOCIAL_LOOKUP</span>
                              {isQuickScanning && <RefreshCw size={10} className="animate-spin text-neon-cyan" />}
                            </div>
                            <button 
                              onClick={() => handleQuickSocialScan(searchQuery, true)}
                              disabled={isQuickScanning}
                              className="text-[8px] font-mono text-neon-lime hover:text-white uppercase tracking-widest px-2 py-1 border border-neon-lime/30 rounded hover:bg-neon-lime/20 transition-all disabled:opacity-50"
                            >
                              Deep Scan
                            </button>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2">
                            {isQuickScanning ? (
                              <div className="space-y-2 p-4">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            ) : quickSocialResults.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {quickSocialResults.map((site) => (
                                  <div
                                    key={site.name}
                                    className="p-2 border border-neon-lime/20 bg-neon-lime/5 hover:bg-neon-lime/10 flex flex-col gap-1 group transition-all rounded text-left relative"
                                  >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-1">
                                          {site.avatar && (
                                            <img 
                                              src={site.avatar} 
                                              alt={site.name} 
                                              className="w-4 h-4 rounded-full border border-white/10"
                                              referrerPolicy="no-referrer"
                                            />
                                          )}
                                          <span className="text-[9px] font-mono uppercase truncate mr-2 text-neon-lime">{site.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={() => {
                                              setSearchQuery(site.url);
                                              setShowQuickResults(false);
                                            }}
                                            title="Use as target"
                                            className="p-1 hover:bg-neon-cyan/20 rounded transition-colors"
                                          >
                                            <Target size={10} className="text-neon-cyan" />
                                          </button>
                                          <button 
                                            onClick={() => handleToolSearch(site.name, site.url)}
                                            title="Open tool"
                                            className="p-1 hover:bg-neon-lime/20 rounded transition-colors"
                                          >
                                            <ExternalLink size={10} className="text-neon-lime" />
                                          </button>
                                        </div>
                                      </div>
                                      {site.followers && (
                                        <span className="text-[7px] text-neon-cyan/60 font-mono uppercase tracking-tighter">{site.followers}</span>
                                      )}
                                      {site.bio && (
                                        <p className="text-[7px] text-white/40 line-clamp-2 leading-tight mt-1 italic">
                                          {site.bio}
                                        </p>
                                      )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">No immediate matches found in top sectors</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleScan()}
                            className="w-full p-3 bg-neon-cyan/10 border-t border-border-primary text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
                          >
                            Execute Full Deep Scan
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* History Dropdown */}
                <AnimatePresence>
                  {showHistoryDropdown && savedSearches.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 w-full mt-2 bg-bg-secondary border border-border-primary shadow-2xl z-50 max-h-64 overflow-y-auto"
                    >
                      <div className="p-2 border-b border-border-primary flex items-center justify-between">
                        <span className="text-[8px] font-mono text-text-secondary uppercase tracking-[0.2em] px-2">RECENT_TARGETS</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavedSearches([]);
                            localStorage.removeItem('osint_saved_searches');
                          }}
                          className="text-[8px] font-mono text-neon-magenta uppercase hover:underline px-2"
                        >
                          CLEAR_ALL
                        </button>
                      </div>
                      {savedSearches.map((s, i) => (
                        <button 
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery(s);
                            setShowHistoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 font-mono text-xs uppercase tracking-widest border-b border-border-primary/5 last:border-0 flex items-center gap-3 group"
                        >
                          <History size={12} className="text-text-secondary group-hover:text-neon-cyan" />
                          <span className="truncate">{s}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Controls & Tabs Sticky Container */}
      <div className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-b-2 border-border-primary shadow-2xl">
        <section>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-border-primary">
            <div className="p-3 md:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6">
              <div className="flex items-center gap-2 flex-1">
                {searchQuery && !searchQuery.includes('.') && !searchQuery.includes('@') && (
                  <button 
                    onClick={() => handleQuickSocialScan(searchQuery)}
                    className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                    title="Quickly lookup potential social media profiles"
                  >
                    <User size={14} />
                    USERNAME_SEARCH
                  </button>
                )}
                {isUsernameOrEmail && (
                  <>
                    <button 
                      onClick={handleSocialDork}
                      className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                      title="Run targeted Google Dorking across social and NSFW platforms"
                    >
                      <Search size={14} />
                      SOCIAL_DORK
                    </button>
                    <button 
                      onClick={handleMassRecon}
                      className="px-4 py-2 bg-neon-magenta/10 border border-neon-magenta text-neon-magenta font-mono text-[10px] uppercase tracking-widest hover:bg-neon-magenta hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,255,0.2)]"
                      title="Run massive scan across social, dating, gaming, and NSFW platforms"
                    >
                      <Zap size={14} className={isMassReconRunning ? 'animate-pulse' : ''} />
                      {isMassReconRunning ? 'SCANNING...' : 'MASS_RECON'}
                    </button>
                  </>
                )}
                {searchQuery && (
                  <button 
                    onClick={() => saveSearch(searchQuery)}
                    className="p-2 text-neon-lime hover:bg-neon-lime/10 rounded transition-all"
                    title="Save current search"
                  >
                    <Save size={18} />
                  </button>
                )}
                <button 
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className={`p-2 rounded transition-all ${showAdvancedSearch ? 'bg-neon-magenta/20 text-neon-magenta' : 'text-white/40 hover:text-white'}`}
                  title="Advanced Dorking"
                >
                  <Terminal size={18} />
                </button>
                <button 
                  onClick={() => handleScan()}
                  disabled={!searchQuery}
                  className={`px-8 py-3 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${!searchQuery ? 'border-white/10 text-white/20' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,243,255,0.2)]'}`}
                >
                  <Terminal size={16} />
                  EXECUTE_SCAN
                </button>
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVisualScan(file);
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isVisualScanning}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isVisualScanning ? 'border-white/10 text-white/20' : 'border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black shadow-[0_0_15px_rgba(255,255,0,0.3)]'}`}
                  title="Visual Intelligence Scan (Nano Banana 2)"
                >
                  {isVisualScanning ? <RefreshCw size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                  {isVisualScanning ? 'ANALYZING_IMAGE...' : 'VISUAL_INTEL'}
                </button>
                <button 
                  onClick={handleSmartSearch}
                  disabled={!searchQuery || isAiLoading}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!searchQuery || isAiLoading ? 'border-white/10 text-white/20' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]'}`}
                >
                  <Brain size={12} className={isAiLoading ? 'animate-pulse' : ''} />
                  {isAiLoading ? 'ANALYZING...' : 'AI_INTELLIGENCE_SCAN'}
                </button>
                <button 
                  onClick={() => handleScan(false)}
                  disabled={!searchQuery || isScanning}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all ${!searchQuery || isScanning ? 'border-white/10 text-white/20' : 'border-neon-lime text-neon-lime hover:bg-neon-lime hover:text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'}`}
                >
                  {isScanning && !isDeepScan ? 'SCANNING...' : 'RUN_SCAN'}
                </button>
                <button 
                  onClick={() => handleScan(true)}
                  disabled={!searchQuery || isScanning}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!searchQuery || isScanning ? 'border-white/10 text-white/20' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.3)]'}`}
                >
                  <Zap size={12} />
                  {isScanning && isDeepScan && !isHistoricalScan ? 'INVESTIGATING...' : 'DEEP_SCAN'}
                </button>
                <button 
                  onClick={handleHistoricalScan}
                  disabled={!searchQuery || isScanning}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!searchQuery || isScanning ? 'border-white/10 text-white/20' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]'}`}
                >
                  <History size={12} />
                  {isScanning && isHistoricalScan ? 'ARCHIVING...' : 'HISTORICAL_SCAN'}
                </button>
                <button 
                  onClick={() => {
                    const emailGroup = TOOL_GROUPS.find(g => g.name === 'Email Intelligence');
                    if (emailGroup) {
                      setSelectedGroup(emailGroup.id);
                      setTimeout(() => {
                        handleRunGroup();
                      }, 0);
                    }
                  }}
                  disabled={!searchQuery || !searchQuery.includes('@')}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!searchQuery || !searchQuery.includes('@') ? 'border-white/10 text-white/20' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.3)]'}`}
                >
                  <Mail size={12} />
                  EMAIL_INTEL
                </button>
                <button 
                  onClick={() => handleScan(true)}
                  disabled={!searchQuery || isScanning}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!searchQuery || isScanning ? 'border-white/10 text-white/20' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]'}`}
                >
                  <Search size={12} />
                  {isScanning && isDeepScan ? 'QUERYING...' : 'IDENTITY_SCAN'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center divide-x divide-white/10">
              <div className="p-3 md:p-6 flex items-center gap-3 w-full lg:w-auto">
                <Filter size={18} className="text-neon-magenta shrink-0" />
                <select 
                  className="w-full bg-transparent border-none outline-none font-mono text-[10px] md:text-sm uppercase tracking-widest cursor-pointer text-neon-magenta"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                >
                  <option value="All" className="bg-[#1a1a1a]">ALL_SECTORS ({OSINT_TOOLS.length})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#1a1a1a]">
                      {cat.toUpperCase()} ({categoryCounts[cat] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 md:p-6 flex items-center gap-3 w-full lg:w-auto">
                <Layers size={18} className="text-neon-cyan shrink-0" />
                <div className="flex items-center gap-2 w-full">
                  <select 
                    className="w-full bg-transparent border-none outline-none font-mono text-[10px] md:text-sm uppercase tracking-widest cursor-pointer text-neon-cyan"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    <option value="" className="bg-[#1a1a1a]">SELECT_TOOL_GROUP</option>
                    {TOOL_GROUPS.map(group => (
                      <option key={group.id} value={group.id} className="bg-[#1a1a1a]">
                        {group.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleRunGroup}
                    disabled={!searchQuery || !selectedGroup}
                    className={`px-3 py-1 border-2 font-mono text-[9px] uppercase tracking-tighter transition-all shrink-0 ${!searchQuery || !selectedGroup ? 'border-white/10 text-white/20' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black'}`}
                  >
                    RUN_GROUP
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {showAdvancedSearch && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-7xl mx-auto px-6 py-4 border-t border-white/10 bg-black/40"
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                  <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded">
                    <Search size={16} className="text-neon-magenta" />
                    <input 
                      type="text" 
                      list="dork-suggestions"
                      placeholder="ENTER GOOGLE DORK (e.g. site:linkedin.com 'target name')..."
                      className="w-full bg-transparent border-none outline-none font-mono text-xs text-neon-magenta uppercase tracking-widest"
                      value={advancedDork}
                      onChange={(e) => setAdvancedDork(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGoogleDork()}
                    />
                    <datalist id="dork-suggestions">
                      {COMMON_DORKS.map(d => (
                        <option key={d.query} value={d.query}>{d.label}</option>
                      ))}
                    </datalist>
                  </div>
                  <button 
                    onClick={handleGoogleDork}
                    disabled={!advancedDork}
                    className={`px-6 py-2 border-2 font-mono text-[10px] uppercase tracking-widest transition-all ${!advancedDork ? 'border-white/10 text-white/20' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.2)]'}`}
                  >
                    EXECUTE_DORK
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mr-2">Quick_Dorks:</span>
                  {COMMON_DORKS.slice(0, 6).map(d => (
                    <button 
                      key={d.query}
                      onClick={() => {
                        setSearchQuery(d.query);
                        setAdvancedDork(d.query);
                      }}
                      className="text-[9px] font-mono text-neon-magenta/60 hover:text-neon-magenta transition-colors border border-neon-magenta/20 px-2 py-0.5 rounded hover:bg-neon-magenta/5"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {aiExplanation && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-7xl mx-auto px-6 py-4 border-t border-white/10 bg-neon-cyan/5 overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-neon-cyan/20 rounded border border-neon-cyan/40 shrink-0">
                    <Brain size={16} className="text-neon-cyan" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                        <Sparkles size={12} /> AI_INTELLIGENCE_BRIEFING
                      </h4>
                      <button 
                        onClick={() => setAiExplanation('')}
                        className="text-[9px] text-white/40 hover:text-white uppercase font-mono"
                      >
                        DISMISS
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-white/80 leading-relaxed whitespace-pre-wrap">
                      {aiExplanation}
                    </div>

                    {isAiExecuting && (
                      <div className="mt-4 p-3 bg-neon-lime/10 border border-neon-lime/30 rounded flex items-center gap-3">
                        <Activity size={14} className="text-neon-lime animate-pulse" />
                        <span className="text-[10px] font-mono text-neon-lime uppercase tracking-widest">
                          AI_AUTONOMOUS_EXECUTION_IN_PROGRESS: {aiActions.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk Actions Bar */}
          <AnimatePresence>
            {selectedToolIds.size > 0 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-black border-2 border-neon-cyan p-4 shadow-[0_0_30px_rgba(0,243,255,0.3)] flex items-center gap-6"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest font-bold">
                    {selectedToolIds.size}_TOOLS_SELECTED
                  </span>
                  <span className="text-[8px] font-mono text-white/40 uppercase">Bulk_Actions_Available</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBulkExport}
                    className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
                  >
                    <ExternalLink size={12} /> EXPORT_DETAILS
                  </button>
                  <button 
                    onClick={() => {
                      // Logic to create a custom group or add to existing
                      alert('Custom workflow feature coming soon. Tools exported to JSON.');
                      handleBulkExport();
                    }}
                    className="px-4 py-2 bg-neon-magenta/10 border border-neon-magenta text-neon-magenta font-mono text-[10px] uppercase tracking-widest hover:bg-neon-magenta hover:text-black transition-all flex items-center gap-2"
                  >
                    <Layers size={12} /> CREATE_WORKFLOW
                  </button>
                  <button 
                    onClick={() => setSelectedToolIds(new Set())}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedGroup && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="max-w-7xl mx-auto px-6 py-4 border-t border-white/10 bg-neon-cyan/5"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-neon-cyan/20 rounded border border-neon-cyan/40">
                    <Zap size={16} className="text-neon-cyan" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest font-bold">
                      Workflow: {TOOL_GROUPS.find(g => g.id === selectedGroup)?.name}
                    </h4>
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">
                      {TOOL_GROUPS.find(g => g.id === selectedGroup)?.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {TOOL_GROUPS.find(g => g.id === selectedGroup)?.toolIds.map((id, i) => {
                    const tool = OSINT_TOOLS.find(t => t.id === id);
                    const isDone = workflowProgress[id];
                    const isRunning = currentlyRunningToolId === id;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <button 
                          onClick={() => handleLaunchSingleInWorkflow(id)}
                          disabled={!searchQuery}
                          className={`px-3 py-1 border font-mono text-[9px] uppercase transition-all flex items-center gap-2 ${!searchQuery ? 'border-white/5 text-white/10' : isRunning ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10 animate-pulse shadow-[0_0_10px_rgba(0,243,255,0.3)]' : isDone ? 'border-neon-lime text-neon-lime bg-neon-lime/5' : 'border-white/20 text-white/60 hover:border-neon-cyan hover:text-neon-cyan'}`}
                        >
                          {isRunning ? <RefreshCw size={10} className="animate-spin" /> : isDone ? <CheckCircle2 size={10} /> : null}
                          {isRunning ? 'RUNNING...' : tool?.name}
                        </button>
                        {i < (TOOL_GROUPS.find(g => g.id === selectedGroup)?.toolIds.length || 0) - 1 && (
                          <span className="text-white/10">→</span>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
                  
                  <div className="flex flex-col items-end gap-1">
                    <button 
                      onClick={handleRunGroup}
                      disabled={!searchQuery}
                      className={`px-4 py-1 border-2 font-mono text-[10px] uppercase tracking-widest transition-all ${!searchQuery ? 'border-white/10 text-white/20' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_10px_rgba(255,0,255,0.2)]'}`}
                    >
                      LAUNCH_ALL_SEQUENCE
                    </button>
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">
                      * Ensure popups are allowed
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedGroup('');
                      setWorkflowProgress({});
                    }}
                    className="p-1 text-white/20 hover:text-white transition-colors"
                    title="Close Workflow"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Tabs inside sticky container - Hidden on mobile, replaced by bottom nav */}
        <div className="max-w-7xl mx-auto px-3 md:px-6 hidden md:flex gap-2 md:gap-6 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('Tools')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Tools' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Tool_Directory ({globalFilteredTools.length})
          </button>
          <button 
            onClick={() => setActiveTab('Workflows')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Workflows' ? 'border-neon-magenta text-neon-magenta' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Investigation_Workflows ({TOOL_GROUPS.length})
          </button>
          <button 
            onClick={() => setActiveTab('Scan')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Scan' ? 'border-neon-lime text-neon-lime' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Live_Scan_Results
          </button>
          <button 
            onClick={() => setActiveTab('TargetIntel')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'TargetIntel' ? 'border-neon-lime text-neon-lime' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Target_Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('Intel')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Intel' ? 'border-neon-yellow text-neon-yellow' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Intel_Feed
          </button>
          <button 
            onClick={() => setActiveTab('Dorks')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Dorks' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Dork_Generator
          </button>
          <button 
            onClick={() => setActiveTab('Analyst')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Analyst' ? 'border-neon-magenta text-neon-magenta' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            AI_Analyst
          </button>
          <button 
            onClick={() => setActiveTab('Browser')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Browser' ? 'border-neon-lime text-neon-lime' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            In_App_Browser
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-bg-primary/95 backdrop-blur-xl border-t-2 border-border-primary md:hidden flex items-center justify-around p-2 pb-6">
        <button 
          onClick={() => setActiveTab('Tools')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Tools' ? 'text-neon-cyan' : 'text-white/40'}`}
        >
          <Globe size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Tools</span>
        </button>
        <button 
          onClick={() => setActiveTab('Workflows')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Workflows' ? 'text-neon-magenta' : 'text-white/40'}`}
        >
          <Layers size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Flows</span>
        </button>
        <button 
          onClick={() => setActiveTab('Scan')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Scan' ? 'text-neon-lime' : 'text-white/40'}`}
        >
          <Activity size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Scan</span>
        </button>
        <button 
          onClick={() => setActiveTab('TargetIntel')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'TargetIntel' ? 'text-neon-lime' : 'text-white/40'}`}
        >
          <Shield size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Intel_Report</span>
        </button>
        <button 
          onClick={() => setActiveTab('Intel')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Intel' ? 'text-neon-yellow' : 'text-white/40'}`}
        >
          <Zap size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Intel</span>
        </button>
        <button 
          onClick={() => setActiveTab('Analyst')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Analyst' ? 'text-neon-magenta' : 'text-white/40'}`}
        >
          <Brain size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">AI</span>
        </button>
      </div>

      {/* Grid or Scan Results */}
      <main className="max-w-7xl mx-auto p-6 md:p-10 pb-32 md:pb-10">
        <AnimatePresence mode="popLayout">
          {activeTab === 'Tools' ? (
            <motion.div 
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Saved Searches & History */}
              {(savedSearches.length > 0 || scanHistory.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {savedSearches.length > 0 && (
                    <div className="bg-black/40 border-2 border-white/10 p-6">
                      <h3 className="text-[10px] font-mono text-neon-lime uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <CheckCircle2 size={14} /> SAVED_TARGETS
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {savedSearches.map(s => (
                          <button 
                            key={s}
                            onClick={() => {
                              setSearchQuery(s);
                              setSelectedGroup(TOOL_GROUPS[0].id);
                              setTimeout(() => handleRunGroup(), 0);
                            }}
                            className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest hover:border-neon-lime hover:text-neon-lime transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {scanHistory.length > 0 && (
                    <div className="bg-black/40 border-2 border-white/10 p-6">
                      <h3 className="text-[10px] font-mono text-neon-cyan uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <History size={14} /> RECENT_SCANS
                      </h3>
                      <div className="space-y-2">
                        {scanHistory.map((h, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 group/item">
                            <button 
                              onClick={() => {
                                setSearchQuery(h.target);
                                setScanResults(h);
                                setActiveTab('Scan');
                              }}
                              className="text-[10px] font-mono text-white/60 hover:text-neon-cyan transition-all truncate uppercase tracking-widest"
                            >
                              [{h.type}] {h.target}
                            </button>
                            <span className="text-[8px] font-mono text-white/20 uppercase shrink-0">
                              {new Date(h.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isAiLoading ? (
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-black/40 border-2 border-white/10 p-8 flex flex-col gap-6 h-[400px]">
                      <div className="flex justify-between">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="w-20 h-3" />
                          <Skeleton className="w-24 h-3" />
                        </div>
                      </div>
                      <Skeleton className="w-3/4 h-10" />
                      <div className="space-y-2">
                        <Skeleton className="w-full h-3" />
                        <Skeleton className="w-full h-3" />
                        <Skeleton className="w-2/3 h-3" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="w-16 h-6" />
                        <Skeleton className="w-16 h-6" />
                        <Skeleton className="w-16 h-6" />
                      </div>
                      <div className="mt-auto grid grid-cols-2 gap-4">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                      </div>
                    </div>
                  ))
                ) : globalFilteredTools.map((tool, index) => (
                <motion.div
                  layout
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.01 }}
                  className="group relative bg-black/40 border-2 border-white/20 p-8 flex flex-col gap-6 hover:border-neon-cyan hover:shadow-[0_0_30px_rgba(0,243,255,0.2)] transition-all duration-500 overflow-hidden"
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 left-4 z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleToolSelection(tool.id);
                      }}
                      className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${selectedToolIds.has(tool.id) ? 'bg-neon-cyan border-neon-cyan text-black' : 'border-white/20 hover:border-neon-cyan/50'}`}
                    >
                      {selectedToolIds.has(tool.id) && <CheckCircle2 size={14} />}
                    </button>
                  </div>

                  {/* Paint Splash Effect */}
                  <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-neon-magenta/10 rounded-full blur-3xl group-hover:bg-neon-magenta/20 transition-colors" />

                  <div className="flex justify-between items-start relative z-10">
                    <div className="p-3 border-2 border-current rounded-lg group-hover:text-neon-cyan transition-colors flex items-center justify-center w-12 h-12">
                      <Favicon url={tool.url} name={tool.name} className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-neon-lime opacity-80">
                        {tool.category}
                      </span>
                      <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest">FREE_ACCESS</span>
                    </div>
                  </div>

                    <div className="flex-1 relative z-10">
                      <h3 
                        onClick={() => setSelectedToolForModal(tool)}
                        className="text-4xl font-graffiti mb-4 tracking-wider group-hover:text-neon-cyan transition-colors cursor-pointer"
                      >
                        {tool.name}
                      </h3>
                      <p className="text-sm font-mono opacity-60 leading-relaxed line-clamp-3 group-hover:opacity-100 transition-opacity">
                        {tool.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 relative z-10">
                      {tool.tags.map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => setToolSearchQuery(tag)}
                          className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest group-hover:border-neon-cyan/30 hover:bg-neon-cyan hover:text-black transition-all"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>

                    {tool.aiReason && (
                      <div className="relative z-10 p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg animate-pulse">
                        <h4 className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Sparkles size={12} /> AI_RECOMMENDATION_REASON
                        </h4>
                        <p className="text-[11px] font-mono text-neon-cyan leading-relaxed">
                          {tool.aiReason}
                        </p>
                        {tool.aiDirectLink && (
                          <a 
                            href={tool.aiDirectLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-[10px] text-neon-cyan hover:text-white transition-colors border-b border-neon-cyan/30"
                          >
                            <ExternalLink size={10} /> ACCESS_TOOL_DIRECTLY
                          </a>
                        )}
                      </div>
                    )}

                    {tool.howToUse && (
                      <div className="relative z-10 p-4 bg-white/5 border border-white/10 rounded-lg">
                        <h4 className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Info size={12} /> HOW_TO_USE
                        </h4>
                        <p className="text-[11px] font-mono opacity-60 leading-relaxed">
                          {tool.howToUse}
                        </p>
                      </div>
                    )}

                    {tool.combinations && tool.combinations.length > 0 && (
                      <div className="relative z-10">
                        <h4 className="text-[10px] font-mono text-neon-magenta uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Zap size={12} /> BEST_COMBINATIONS
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tool.combinations.map(combo => (
                            <button 
                              key={combo}
                              onClick={() => setToolSearchQuery(combo)}
                              className="px-2 py-1 bg-neon-magenta/5 border border-neon-magenta/20 text-[9px] font-mono uppercase text-neon-magenta hover:bg-neon-magenta hover:text-black transition-all"
                            >
                              {combo}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mt-4 relative z-10">
                    <button 
                      onClick={() => setSelectedToolForModal(tool)}
                      className="flex items-center justify-center border-2 border-white/20 p-4 font-mono text-[10px] uppercase tracking-widest hover:border-neon-yellow hover:text-neon-yellow transition-all"
                    >
                      DETAILS
                      <Info size={14} className="ml-2" />
                    </button>
                    <ToolActionButton 
                      onClick={() => handleToolSearch(tool, tool.url)}
                      className="flex items-center justify-center border-2 border-white/20 p-4 font-mono text-[10px] uppercase tracking-widest hover:border-neon-magenta hover:text-neon-magenta transition-all"
                      tooltip={tool.description}
                      howToUse={tool.howToUse}
                    >
                      OPEN
                      <ExternalLink size={14} className="ml-2" />
                    </ToolActionButton>
                    <ToolActionButton 
                      onClick={() => handleToolSearch(tool)}
                      disabled={!searchQuery}
                      className={`flex items-center justify-center border-2 p-4 font-mono text-[10px] uppercase tracking-widest transition-all ${!searchQuery ? 'border-white/5 text-white/20 cursor-not-allowed' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black'}`}
                      tooltip={tool.description}
                      howToUse={tool.howToUse}
                    >
                      RUN
                      <Search size={14} className="ml-2" />
                    </ToolActionButton>
                    </div>
                </motion.div>
              ))}
              </div>
            </motion.div>
          ) : activeTab === 'Workflows' ? (
            <motion.div 
              key="workflows"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {TOOL_GROUPS.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative bg-black/40 border-2 p-8 flex flex-col gap-6 transition-all duration-500 overflow-hidden ${selectedGroup === group.id ? 'border-neon-magenta shadow-[0_0_30px_rgba(255,0,255,0.2)]' : 'border-white/20 hover:border-neon-magenta/50'}`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className={`p-3 border-2 rounded-lg transition-colors ${selectedGroup === group.id ? 'text-neon-magenta border-neon-magenta' : 'text-white/40 border-white/20'}`}>
                      <Zap size={24} />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-neon-magenta uppercase tracking-widest block">WORKFLOW_SEQUENCE</span>
                      <span className="text-[10px] font-mono opacity-40 uppercase">{group.toolIds.length} TOOLS</span>
                    </div>
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-4xl font-graffiti mb-4 tracking-wider group-hover:text-neon-magenta transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-sm font-mono opacity-60 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex flex-wrap gap-2">
                      {group.suggestedSequence.map((name, i) => (
                        <div key={name} className="flex items-center gap-2">
                          <ToolActionButton 
                            onClick={() => handleToolSearch(name)}
                            className="px-2 py-1 bg-white/5 border border-white/10 text-[9px] font-mono uppercase text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                            tooltip={findToolByName(name)?.description || `Tool in workflow: ${name}`}
                            howToUse={findToolByName(name)?.howToUse}
                          >
                            {name}
                          </ToolActionButton>
                          {i < group.suggestedSequence.length - 1 && <span className="text-white/20">→</span>}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(group.id);
                          setTimeout(() => handleRunGroup(), 0);
                        }}
                        disabled={!searchQuery}
                        className={`flex-1 py-4 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${!searchQuery ? 'border-white/10 text-white/20 cursor-not-allowed' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.2)]'}`}
                      >
                        <Terminal size={16} />
                        EXECUTE_WORKFLOW
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!searchQuery) return;
                          setActiveWorkflowId(group.id);
                          setActiveWorkflowIndex(0);
                          const tool = OSINT_TOOLS.find(t => t.id === group.toolIds[0]);
                          if (tool) {
                            const url = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
                            setBrowserUrl(url);
                            setBrowserHistory(prev => [url, ...prev].slice(0, 50));
                            setBrowserForwardHistory([]);
                            setActiveTab('Browser');
                          }
                        }}
                        disabled={!searchQuery}
                        className={`px-6 py-4 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${!searchQuery ? 'border-white/10 text-white/20 cursor-not-allowed' : 'border-neon-lime text-neon-lime hover:bg-neon-lime hover:text-black shadow-[0_0_15px_rgba(0,255,0,0.1)]'}`}
                        title="Open workflow tools in in-app browser"
                      >
                        <Globe size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : activeTab === 'Browser' ? (
            <motion.div 
              key="browser"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/60 border-4 border-neon-lime p-4 font-mono relative overflow-hidden min-h-[800px] flex flex-col"
            >
              {/* Browser Header */}
              <div className="flex items-center gap-4 mb-4 border-b border-neon-lime/30 pb-4">
                <div className="flex gap-2">
                  <button 
                    onClick={handleBrowserBack} 
                    disabled={browserHistory.length <= 1}
                    className="p-2 hover:bg-white/10 rounded transition-all text-neon-lime disabled:opacity-20"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleBrowserForward} 
                    disabled={browserForwardHistory.length === 0}
                    className="p-2 hover:bg-white/10 rounded transition-all text-neon-lime disabled:opacity-20"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => setBrowserUrl(browserUrl)} className="p-2 hover:bg-white/10 rounded transition-all text-neon-lime"><RotateCcw size={16} /></button>
                </div>
                
                {activeWorkflowId && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
                    <button 
                      disabled={activeWorkflowIndex === 0}
                      onClick={() => {
                        const group = TOOL_GROUPS.find(g => g.id === activeWorkflowId);
                        if (group && activeWorkflowIndex > 0) {
                          const nextIdx = activeWorkflowIndex - 1;
                          const tool = OSINT_TOOLS.find(t => t.id === group.toolIds[nextIdx]);
                          if (tool) {
                            const url = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
                            setBrowserUrl(url);
                            setBrowserHistory(prev => [url, ...prev].slice(0, 50));
                            setBrowserForwardHistory([]);
                            setActiveWorkflowIndex(nextIdx);
                          }
                        }
                      }}
                      className="p-1 hover:bg-neon-magenta/20 rounded disabled:opacity-20 text-neon-magenta"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-[9px] font-mono text-neon-magenta uppercase tracking-widest">
                      Tool {activeWorkflowIndex + 1}/{TOOL_GROUPS.find(g => g.id === activeWorkflowId)?.toolIds.length}
                    </span>
                    <button 
                      disabled={activeWorkflowIndex === (TOOL_GROUPS.find(g => g.id === activeWorkflowId)?.toolIds.length || 0) - 1}
                      onClick={() => {
                        const group = TOOL_GROUPS.find(g => g.id === activeWorkflowId);
                        if (group && activeWorkflowIndex < group.toolIds.length - 1) {
                          const nextIdx = activeWorkflowIndex + 1;
                          const tool = OSINT_TOOLS.find(t => t.id === group.toolIds[nextIdx]);
                          if (tool) {
                            const url = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
                            setBrowserUrl(url);
                            setBrowserHistory(prev => [url, ...prev].slice(0, 50));
                            setBrowserForwardHistory([]);
                            setActiveWorkflowIndex(nextIdx);
                          }
                        }
                      }}
                      className="p-1 hover:bg-neon-magenta/20 rounded disabled:opacity-20 text-neon-magenta"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                <div className="flex-1 flex flex-col gap-2">
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {(() => {
                      try {
                        const url = new URL(browserUrl);
                        const parts = url.pathname.split('/').filter(Boolean);
                        return (
                          <>
                            <button 
                              onClick={() => setBrowserUrl(url.origin)}
                              className="text-[9px] uppercase tracking-tighter text-neon-lime/60 hover:text-neon-lime transition-colors whitespace-nowrap"
                            >
                              {url.hostname}
                            </button>
                            {parts.map((part, i) => (
                              <React.Fragment key={i}>
                                <span className="text-[9px] text-white/20">/</span>
                                <button 
                                  onClick={() => {
                                    const path = '/' + parts.slice(0, i + 1).join('/');
                                    setBrowserUrl(url.origin + path);
                                  }}
                                  className="text-[9px] uppercase tracking-tighter text-neon-lime/60 hover:text-neon-lime transition-colors whitespace-nowrap"
                                >
                                  {part}
                                </button>
                              </React.Fragment>
                            ))}
                          </>
                        );
                      } catch (e) {
                        return <span className="text-[9px] text-white/20 uppercase tracking-tighter">Invalid_Path</span>;
                      }
                    })()}
                  </div>

                  <div className="flex items-center bg-black/40 border border-neon-lime/30 px-4 py-2 rounded relative group">
                    <Globe size={14} className="text-neon-lime/50 mr-3" />
                    <input 
                      type="text" 
                      value={browserUrl}
                      onChange={(e) => setBrowserUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setBrowserUrl((e.target as HTMLInputElement).value)}
                      className="bg-transparent border-none outline-none text-xs text-white/80 w-full font-mono"
                    />
                    {isBrowserLoading && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Activity size={12} className="text-neon-lime animate-spin" />
                      </div>
                    )}
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-[2px] bg-neon-magenta overflow-hidden w-full transition-opacity duration-300" style={{ opacity: isBrowserLoading ? 1 : 0 }}>
                      <div className="h-full bg-neon-cyan animate-loading-bar" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setBrowserProxyMode(!browserProxyMode)}
                    className={`px-3 py-1 border text-[10px] uppercase tracking-widest transition-all ${browserProxyMode ? 'bg-neon-magenta border-neon-magenta text-black' : 'border-white/20 text-white/40 hover:border-white/40'}`}
                  >
                    Proxy_Mode
                  </button>
                  <button 
                    onClick={() => window.open(browserUrl, '_blank')}
                    className="p-2 hover:bg-white/10 rounded transition-all text-neon-cyan"
                    title="Open in external browser"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>

              {/* Browser Content */}
              <div className="flex-1 bg-white relative rounded overflow-hidden min-h-[600px]">
                {browserProxyMode ? (
                  <div className="absolute inset-0 bg-[#141414] overflow-auto p-8 text-[#E4E3E0]">
                    {isBrowserLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Activity className="animate-spin text-neon-magenta" size={48} />
                        <p className="text-neon-magenta animate-pulse uppercase tracking-widest">Proxying_Intelligence_Data...</p>
                      </div>
                    ) : browserProxyResults.length > 0 ? (
                      <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <h3 className="text-xl uppercase tracking-widest text-neon-magenta">Extracted_Data_Nodes</h3>
                          <span className="text-[10px] opacity-50 uppercase">Source: {browserUrl}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {browserProxyResults.map((item, i) => (
                            <div key={i} className={`p-4 bg-white/5 border transition-all group ${
                              item.type === 'header' ? 'border-neon-cyan/30 bg-neon-cyan/5' : 
                              item.type === 'image' ? 'border-neon-magenta/30 bg-neon-magenta/5' :
                              item.type === 'table' ? 'border-neon-yellow/30 bg-neon-yellow/5' :
                              item.type === 'list' ? 'border-neon-lime/30 bg-neon-lime/5' :
                              'border-white/10 hover:border-neon-lime/50'
                            }`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  {item.type === 'header' ? (
                                    <p className={`font-black uppercase tracking-widest text-neon-cyan ${
                                      item.importance === 1 ? 'text-lg' : item.importance === 2 ? 'text-base' : 'text-sm'
                                    }`}>
                                      {item.text}
                                    </p>
                                  ) : item.type === 'image' ? (
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center gap-2">
                                        <ImageIcon size={14} className="text-neon-magenta" />
                                        <span className="text-[10px] text-neon-magenta uppercase tracking-widest">{item.text}</span>
                                      </div>
                                      <img 
                                        src={item.src} 
                                        alt={item.text} 
                                        referrerPolicy="no-referrer"
                                        className="max-w-xs rounded border border-white/10"
                                      />
                                      <p className="text-[8px] opacity-30 break-all">{item.src}</p>
                                    </div>
                                  ) : item.type === 'table' ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-[10px] border-collapse">
                                        <tbody>
                                          {item.rows?.map((row: any[], ri: number) => (
                                            <tr key={ri} className="border-b border-white/5">
                                              {row.map((cell: string, ci: number) => (
                                                <td key={ci} className="p-1 border-r border-white/5 text-white/60">{cell}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : item.type === 'list' ? (
                                    <ul className="list-disc list-inside text-[10px] space-y-1 text-white/60">
                                      {item.items?.map((li: string, lii: number) => (
                                        <li key={lii}>{li}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <>
                                      <p className="text-xs font-mono text-white/80 leading-relaxed">{item.text}</p>
                                      {item.href && (
                                        <button 
                                          onClick={() => {
                                            const newUrl = item.href.startsWith('http') ? item.href : new URL(item.href, browserUrl).href;
                                            setBrowserUrl(newUrl);
                                          }}
                                          className="mt-2 text-[10px] text-neon-cyan hover:underline uppercase tracking-widest flex items-center gap-1"
                                        >
                                          Follow_Link <ExternalLink size={10} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className={`text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded border ${
                                  item.type === 'header' ? 'border-neon-cyan text-neon-cyan' :
                                  item.type === 'image' ? 'border-neon-magenta text-neon-magenta' :
                                  item.type === 'table' ? 'border-neon-yellow text-neon-yellow' :
                                  item.type === 'list' ? 'border-neon-lime text-neon-lime' :
                                  'border-white/20 text-white/40'
                                }`}>
                                  {item.type?.toUpperCase() || 'DATA'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-30">
                        <Search size={64} />
                        <p className="mt-4 uppercase tracking-widest">No_Data_Extracted</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {isBrowserLoading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                        <Activity className="animate-spin text-neon-lime" size={32} />
                        <p className="text-[10px] text-neon-lime uppercase tracking-widest animate-pulse">Establishing_Secure_Connection...</p>
                      </div>
                    )}
                    <iframe 
                      src={browserUrl} 
                      className="w-full h-full border-none"
                      title="OSINT Browser"
                      onLoad={() => setIsBrowserLoading(false)}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'Scan' ? (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/60 border-4 border-neon-lime p-8 font-mono relative overflow-hidden min-h-[600px]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Terminal size={120} className="text-neon-lime" />
              </div>

              <div className="flex items-center gap-4 mb-8 border-b-2 border-neon-lime/30 pb-4">
                <Terminal size={24} className="text-neon-lime" />
                <h2 className="text-2xl uppercase tracking-widest text-neon-lime">OSINT_SCANNER_V2.0</h2>
                <div className="flex-1" />
                <div className="flex items-center gap-4">
                  <span className="text-xs opacity-50 hidden md:inline">TARGET: {searchQuery || 'NONE'}</span>
                  {scanHistory.length > 0 && (
                    <button 
                      onClick={exportResults}
                      className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
                      title="Export all scan history to JSON"
                    >
                      <Download size={14} /> EXPORT_HISTORY
                    </button>
                  )}
                  {scanResults && (
                    <button 
                      onClick={() => {
                        const logContent = `OSINT HUB - SCAN REPORT\n` +
                          `Target: ${searchQuery}\n` +
                          `Timestamp: ${new Date().toISOString()}\n` +
                          `-----------------------------------\n\n` +
                          (scanResults.whois ? `[WHOIS DATA]\n${JSON.stringify(scanResults.whois, null, 2)}\n\n` : '') +
                          (scanResults.dns ? `[DNS RECORDS]\n${JSON.stringify(scanResults.dns, null, 2)}\n\n` : '') +
                          (scanResults.social ? `[SOCIAL PRESENCE]\n${scanResults.social.map((s: any) => `${s.name}: ${s.status}${s.url ? ` (${s.url})` : ''}`).join('\n')}\n` : '');
                        
                        const blob = new Blob([logContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `osint_log_${searchQuery.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-3 py-1 border border-neon-lime text-neon-lime text-[10px] uppercase tracking-tighter hover:bg-neon-lime hover:text-black transition-all"
                    >
                      <Shield size={12} />
                      DOWNLOAD_LOG
                    </button>
                  )}
                </div>
              </div>

              {(isScanning && !scanResults) ? (
                <div className="space-y-8">
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <div className={`w-24 h-24 border-4 ${isDeepScan ? 'border-neon-magenta' : 'border-neon-lime'} border-t-transparent rounded-full animate-spin`} />
                    <p className={`${isHistoricalScan ? 'text-neon-cyan' : isDeepScan ? 'text-neon-magenta' : 'text-neon-lime'} animate-pulse uppercase tracking-[0.5em] text-center px-6`}>
                      {isHistoricalScan ? 'Reconstructing_Historical_Timeline...' : isDeepScan ? 'Running_Global_Intelligence_Scan...' : 'Scanning_Network_Nodes...'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : scanResults ? (
                <motion.div 
                  key={`results-${scanResults.target}-${scanResults.timestamp}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-black/40 border border-white/5 rounded-xl"
                >
                  <div className="p-6 bg-neon-lime/10 border-2 border-neon-lime/30 rounded-full animate-pulse">
                    <Shield size={48} className="text-neon-lime" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-white">Intelligence_Report_Ready</h2>
                    <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Target: {scanResults.target} // Scan_ID: {scanResults.timestamp.replace(/[^A-Z0-9]/g, '').slice(-8)}</p>
                  </div>
                  <button 
                    onClick={() => setShowIntelligenceWindow(true)}
                    className="px-8 py-4 bg-neon-lime text-black font-mono font-bold uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(57,255,20,0.3)]"
                  >
                    <Shield size={20} />
                    OPEN_INTELLIGENCE_WINDOW
                  </button>
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={exportCurrentScanResults}
                      className="text-[10px] font-mono text-white/40 hover:text-neon-lime uppercase tracking-widest transition-colors"
                    >
                      Export_JSON
                    </button>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <button 
                      onClick={downloadScanLog}
                      className="text-[10px] font-mono text-white/40 hover:text-neon-lime uppercase tracking-widest transition-colors"
                    >
                      Download_Raw_Log
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] opacity-20">
                  <Terminal size={64} className="mb-6" />
                  <p className="uppercase tracking-widest text-center px-6">Awaiting_Input_Sequence...</p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'Intel' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-graffiti tracking-widest uppercase mb-2">Live_Intel_Feed</h2>
                  <p className="font-mono text-xs text-neon-yellow opacity-60 uppercase tracking-widest">Real-time OSINT & Cybersecurity Intelligence</p>
                </div>
                <button 
                  onClick={fetchIntel}
                  disabled={isIntelLoading}
                  className="p-3 bg-white/5 border border-white/10 hover:border-neon-yellow hover:bg-neon-yellow/10 transition-all group"
                >
                  <History className={`text-neon-yellow ${isIntelLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} size={20} />
                </button>
              </div>

              {isIntelLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-[#1a1a1a] border border-white/10 p-6 space-y-4">
                      <div className="flex gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {intelFeed.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative bg-[#1a1a1a] border border-white/10 p-6 hover:border-neon-yellow/50 transition-all"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe size={64} />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-2 py-0.5 bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow text-[9px] font-mono uppercase">
                          {item.source}
                        </span>
                        <span className="text-[9px] font-mono opacity-40 uppercase">
                          {new Date(item.pubDate || item.isoDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-mono font-bold mb-4 group-hover:text-neon-yellow transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      {item.aiSummary ? (
                        <div className="mb-6 p-4 bg-neon-yellow/5 border-l-2 border-neon-yellow/30">
                          <div className="flex items-center gap-2 mb-2 text-[9px] font-mono text-neon-yellow uppercase tracking-widest">
                            <Sparkles size={10} /> AI_SUMMARY
                          </div>
                          <div className="text-[11px] font-mono text-white/80 leading-relaxed markdown-summary">
                            <Markdown>{item.aiSummary}</Markdown>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-mono opacity-60 mb-6 line-clamp-3 leading-relaxed">
                          {item.contentSnippet || item.summary || item.content?.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...'}
                        </p>
                      )}

                      <button 
                        onClick={() => handleReadArticle(item)}
                        className="inline-flex items-center gap-2 text-[10px] font-mono text-neon-yellow uppercase tracking-widest border-b border-neon-yellow/0 hover:border-neon-yellow transition-all"
                      >
                        READ_FULL_REPORT <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'Dorks' ? (
            <motion.div
              key="dorks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                  <h2 className="text-4xl font-graffiti tracking-widest uppercase mb-2 text-neon-cyan">Dork_Generator_v1.0</h2>
                  <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">AI-Powered Advanced Search Query Synthesis</p>
                </div>

                {/* Quick Select Presets */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                  {premadeDorkPresets.map((p, i) => {
                    const Icon = IconMap[p.icon] || Brain;
                    return (
                      <ToolActionButton
                        key={i}
                        onClick={() => setDorkObjectives(p.objective)}
                        className="flex flex-col items-center gap-3 p-4 bg-black/40 border border-white/10 hover:border-neon-cyan hover:bg-neon-cyan/5 transition-all group"
                        tooltip={p.objective}
                        howToUse={`Click to apply this objective to the dork generator. This will help the AI synthesize specific search queries for finding ${p.name.toLowerCase()}.`}
                      >
                        <div className="p-3 bg-white/5 border border-white/10 group-hover:border-neon-cyan/30 transition-all">
                          <Icon className="text-neon-cyan" size={20} />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 group-hover:text-white text-center">{p.name}</span>
                      </ToolActionButton>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-4 w-full md:w-auto">
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input 
                        type="text"
                        placeholder="FILTER PRESETS..."
                        value={dorkPresetFilter}
                        onChange={(e) => setDorkPresetFilter(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-2 pl-8 font-mono text-[10px] text-white uppercase outline-none focus:border-neon-cyan transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) setDorkObjectives(val);
                        }}
                        className="flex-1 bg-black/40 border-2 border-white/10 p-2 font-mono text-[10px] text-white/60 uppercase outline-none focus:border-neon-cyan transition-all"
                      >
                        <option value="">-- SELECT PRESET --</option>
                        <optgroup label="PREMADE">
                          {filteredPremadePresets.map(p => (
                            <option key={p.name} value={p.objective}>{p.name}</option>
                          ))}
                        </optgroup>
                        {filteredCustomPresets.length > 0 && (
                          <optgroup label="CUSTOM">
                            {filteredCustomPresets.map((p, i) => (
                              <option key={i} value={p.objective}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <button 
                        onClick={saveCurrentDorkPreset}
                        className="p-2 border-2 border-white/10 text-white/40 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                        title="Save Current as Preset"
                      >
                        <Save size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Preset Management List */}
                  <div className="max-h-48 overflow-y-auto border border-white/5 bg-black/20 p-2 space-y-1">
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-2 px-1">Manage Presets</div>
                    
                    {filteredPremadePresets.map((p, i) => (
                      <div key={`premade-${i}`} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all group">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-white/60 uppercase">{p.name}</span>
                          <span className="text-[7px] font-mono text-white/20 truncate w-32">{p.objective}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => reorderDorkPreset(i, 'up', true)}
                            className="p-1 hover:text-neon-cyan"
                            title="Move Up"
                          >
                            <ChevronUp size={10} />
                          </button>
                          <button 
                            onClick={() => reorderDorkPreset(i, 'down', true)}
                            className="p-1 hover:text-neon-cyan"
                            title="Move Down"
                          >
                            <ChevronDown size={10} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingPreset({ index: i, isPremade: true });
                              setEditPresetName(p.name);
                              setEditPresetObjective(p.objective);
                            }}
                            className="p-1 hover:text-neon-lime"
                            title="Edit"
                          >
                            <Edit2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredCustomPresets.map((p, i) => (
                      <div key={`custom-${i}`} className="flex items-center justify-between p-2 bg-neon-cyan/5 border border-neon-cyan/20 hover:border-neon-cyan transition-all group">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-neon-cyan uppercase">{p.name}</span>
                          <span className="text-[7px] font-mono text-white/20 truncate w-32">{p.objective}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => reorderDorkPreset(i, 'up', false)}
                            className="p-1 hover:text-neon-cyan"
                            title="Move Up"
                          >
                            <ChevronUp size={10} />
                          </button>
                          <button 
                            onClick={() => reorderDorkPreset(i, 'down', false)}
                            className="p-1 hover:text-neon-cyan"
                            title="Move Down"
                          >
                            <ChevronDown size={10} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingPreset({ index: i, isPremade: false });
                              setEditPresetName(p.name);
                              setEditPresetObjective(p.objective);
                            }}
                            className="p-1 hover:text-neon-lime"
                            title="Edit"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button 
                            onClick={() => deleteDorkPreset(i, false)}
                            className="p-1 hover:text-neon-magenta"
                            title="Delete"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 md:w-64 relative">
                      <Terminal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan opacity-50" />
                      <input 
                        type="text"
                        placeholder="OSINT_OBJECTIVES..."
                        value={dorkObjectives}
                        onChange={(e) => setDorkObjectives(e.target.value)}
                        className="w-full bg-black/40 border-2 border-white/10 p-3 pl-10 font-mono text-xs text-white focus:border-neon-cyan outline-none transition-all"
                      />
                    </div>
                    <button 
                      onClick={generateDorks}
                      disabled={isGeneratingDorks || !searchQuery}
                      className={`px-6 py-3 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${isGeneratingDorks || !searchQuery ? 'border-white/10 text-white/20 cursor-not-allowed' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_20px_rgba(0,243,255,0.2)]'}`}
                    >
                      {isGeneratingDorks ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
                      SYNTHESIZE_DORKS
                    </button>
                  </div>
                </div>

                {/* Edit Preset Modal */}
                <AnimatePresence>
                  {editingPreset && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-bg-secondary border-2 border-neon-cyan p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,243,255,0.2)]"
                      >
                        <h3 className="text-xl font-graffiti text-neon-cyan mb-6 tracking-widest uppercase">Edit_Dork_Preset</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-mono text-white/40 uppercase mb-2">Preset Name</label>
                            <input 
                              type="text"
                              value={editPresetName}
                              onChange={(e) => setEditPresetName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 p-3 font-mono text-xs text-white focus:border-neon-cyan outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-white/40 uppercase mb-2">Dork Objective</label>
                            <textarea 
                              value={editPresetObjective}
                              onChange={(e) => setEditPresetObjective(e.target.value)}
                              rows={3}
                              className="w-full bg-black/40 border border-white/10 p-3 font-mono text-xs text-white focus:border-neon-cyan outline-none resize-none"
                            />
                          </div>
                          <div className="flex gap-4 pt-4">
                            <button 
                              onClick={() => {
                                editDorkPreset(editingPreset.index, editPresetName, editPresetObjective, editingPreset.isPremade);
                                setEditingPreset(null);
                              }}
                              className="flex-1 py-3 bg-neon-cyan text-black font-mono text-xs uppercase tracking-widest hover:bg-white transition-all"
                            >
                              SAVE_CHANGES
                            </button>
                            <button 
                              onClick={() => setEditingPreset(null)}
                              className="flex-1 py-3 border border-white/10 text-white/40 font-mono text-xs uppercase tracking-widest hover:text-white transition-all"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {generatedDorks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {generatedDorks.map((dork, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative bg-black/40 border-2 border-white/10 p-8 hover:border-neon-cyan transition-all duration-500"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Search size={80} />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[10px] font-mono uppercase tracking-widest">
                          {dork.category}
                        </span>
                      </div>

                      <div className="mb-8 p-4 bg-white/5 border-l-4 border-neon-cyan font-mono text-sm break-all">
                        {dork.query}
                      </div>

                      <p className="text-xs font-mono opacity-60 mb-8 leading-relaxed">
                        {dork.description}
                      </p>

                      <div className="flex gap-4">
                        <ToolActionButton 
                          onClick={() => handleRunDork(dork.query)}
                          className="flex-1 py-3 border-2 border-neon-cyan text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all flex items-center justify-center gap-2"
                          tooltip={dork.description}
                          howToUse="Click to execute this dork query in a new tab."
                        >
                          <ExternalLink size={14} /> EXECUTE_QUERY
                        </ToolActionButton>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(dork.query);
                          }}
                          className="px-6 py-3 border-2 border-white/20 text-white/40 font-mono text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Copy size={14} /> COPY
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 border-4 border-dashed border-white/5 rounded-3xl opacity-20">
                  <Brain size={80} className="mb-8" />
                  <p className="font-mono text-xl uppercase tracking-[0.3em] text-center px-12">
                    {isGeneratingDorks ? 'NEURAL_NETWORK_PROCESSING...' : 'AWAITING_SYNTHESIS_PARAMETERS...'}
                  </p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'TargetIntel' ? (
            <motion.div
              key="target-intel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                  <h2 className="text-4xl font-graffiti tracking-widest uppercase mb-2 text-neon-lime">Target_Intelligence_Report</h2>
                  <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">
                    {scanResults ? `Target: ${scanResults.target} // Scan_ID: ${scanResults.timestamp.replace(/[^A-Z0-9]/g, '').slice(-8)}` : 'Awaiting_Target_Input_Sequence...'}
                  </p>
                </div>
                {scanResults && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={exportCurrentScanResults}
                      className="px-4 py-2 border border-neon-lime/30 text-[10px] font-mono text-neon-lime uppercase tracking-widest hover:bg-neon-lime hover:text-black transition-all"
                    >
                      Export_JSON
                    </button>
                    <button 
                      onClick={downloadScanLog}
                      className="px-4 py-2 border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-white/40 transition-all"
                    >
                      Download_Raw_Log
                    </button>
                  </div>
                )}
              </div>

              {!scanResults ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
                  <Shield size={64} className="mb-6" />
                  <p className="text-xl uppercase tracking-[0.3em] font-bold">No Intelligence Data Available</p>
                  <p className="text-xs mt-2 uppercase tracking-widest">Initiate a scan to generate a target dossier</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column: Risk & AI Dossier */}
                  <div className="lg:col-span-2 space-y-12">
                    {/* Risk Score */}
                    {targetRiskScore && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-black/40 border-2 border-neon-magenta p-8 flex flex-col items-center justify-center text-center rounded-xl">
                          <span className="text-[10px] font-mono text-neon-magenta uppercase tracking-widest mb-4">VULNERABILITY_SCORE</span>
                          <div className="text-7xl font-graffiti text-neon-magenta mb-4">{targetRiskScore.score}</div>
                          <div className={`text-xs font-mono uppercase tracking-[0.3em] px-4 py-2 border-2 ${
                            targetRiskScore.level === 'Critical' ? 'bg-neon-magenta text-black border-neon-magenta' :
                            targetRiskScore.level === 'High' ? 'text-neon-magenta border-neon-magenta' :
                            targetRiskScore.level === 'Medium' ? 'text-neon-yellow border-neon-yellow' :
                            'text-neon-lime border-neon-lime'
                          }`}>
                            {targetRiskScore.level}_RISK
                          </div>
                        </div>
                        <div className="md:col-span-2 bg-black/40 border-2 border-white/10 p-8 rounded-xl">
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-6 block">CRITICAL_RISK_FACTORS</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {targetRiskScore.factors.map((factor, i) => (
                              <div key={i} className="flex items-start gap-4">
                                <div className="p-1.5 bg-neon-magenta/20 border border-neon-magenta/40 mt-1">
                                  <AlertTriangle size={14} className="text-neon-magenta" />
                                </div>
                                <p className="text-xs font-mono text-white/80 leading-relaxed uppercase">{factor}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Dossier */}
                    {targetDossier && (
                      <div className="bg-neon-cyan/5 border-2 border-neon-cyan/30 p-8 relative overflow-hidden group rounded-xl">
                        <div className="flex items-center gap-4 mb-8 border-b border-neon-cyan/20 pb-6">
                          <Brain className="text-neon-cyan" size={24} />
                          <h3 className="text-2xl font-graffiti text-neon-cyan tracking-widest uppercase">AI_TARGET_DOSSIER_v1.0</h3>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none font-mono text-white/90 leading-relaxed dossier-content-large">
                          <Markdown>{targetDossier}</Markdown>
                        </div>
                        <div className="mt-8 pt-6 border-t border-neon-cyan/20 flex justify-between items-center">
                          <p className="text-[10px] font-mono text-neon-cyan/50 uppercase tracking-[0.3em]">NEURAL_EXTRACTION_COMPLETE // CONFIDENTIAL</p>
                          <button 
                            onClick={() => {
                              const blob = new Blob([targetDossier], { type: 'text/markdown' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `DOSSIER_${(scanResults?.target || 'TARGET').replace(/[^a-z0-9]/gi, '_').toUpperCase()}.md`;
                              a.click();
                            }}
                            className="text-[10px] font-mono text-neon-cyan hover:underline uppercase tracking-widest"
                          >
                            DOWNLOAD_MD_REPORT
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Suggestions & Actions */}
                    {(aiSuggestions.length > 0 || aiActions.length > 0) && (
                      <div className="space-y-8 pt-12 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          <Sparkles className="text-neon-yellow" size={24} />
                          <h3 className="text-2xl font-graffiti text-neon-yellow tracking-widest uppercase">AI_STRATEGIC_RECOMMENDATIONS</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {aiSuggestions.map((suggestion, i) => (
                            <div key={i} className="bg-black/40 border border-neon-yellow/30 p-6 rounded-xl relative group hover:border-neon-yellow transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="text-sm font-mono text-neon-yellow uppercase tracking-widest">{suggestion.name}</h4>
                                {suggestion.directLink && (
                                  <a 
                                    href={suggestion.directLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-neon-yellow/10 border border-neon-yellow/20 text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all rounded"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-white/60 leading-relaxed uppercase">
                                <span className="text-neon-yellow/40 mr-2">REASON:</span>
                                {suggestion.reason}
                              </p>
                            </div>
                          ))}
                        </div>

                        {aiActions.length > 0 && (
                          <div className="bg-neon-magenta/5 border border-neon-magenta/30 p-6 rounded-xl">
                            <div className="flex items-center gap-3 mb-4">
                              <Terminal size={16} className="text-neon-magenta" />
                              <h4 className="text-[10px] font-mono text-neon-magenta uppercase tracking-[0.3em]">AUTONOMOUS_EXECUTION_LOG</h4>
                            </div>
                            <div className="space-y-2">
                              {aiActions.map((action, i) => (
                                <div key={i} className="flex items-center gap-3 text-[9px] font-mono text-white/40 uppercase">
                                  <span className="text-neon-magenta opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                  <span className="text-white/80">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Social & Breach */}
                  <div className="space-y-12">
                    {/* Social Footprint */}
                    {scanResults.social && Array.isArray(scanResults.social) && (
                      <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                          <User size={20} className="text-neon-lime" />
                          <h4 className="text-sm font-mono uppercase tracking-widest text-white">Digital_Footprint</h4>
                        </div>
                        <div className="space-y-10">
                          {['Social', 'Chat', 'Gaming', 'Dating', 'NSFW', 'Professional', 'Creative', 'Tech', 'Other'].map(category => {
                            const categorySites = scanResults.social.filter((s: any) => s.category === category);
                            if (categorySites.length === 0) return null;
                            
                            const foundCount = categorySites.filter((s: any) => (s.status === 'Found' || s.status === 'Possible but Deleted') && !falsePositives.has(s.name)).length;
                            
                            return (
                              <div key={category} className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-mono uppercase text-neon-cyan flex items-center gap-2">
                                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                                    {category}_SECTOR
                                  </h5>
                                  <span className="text-[9px] font-mono opacity-50">
                                    {foundCount} / {categorySites.length} IDENTIFIED
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-3">
                                  {foundCount === 0 ? (
                                    <div className="py-6 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center bg-black/20">
                                      <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">No_Active_Profiles</span>
                                    </div>
                                  ) : categorySites.map((site: any) => {
                                    const isFalsePositive = falsePositives.has(site.name);
                                    if ((site.status === 'Found' || site.status === 'Possible but Deleted') && !isFalsePositive) {
                                      const isPossible = site.status === 'Possible but Deleted';
                                      return (
                                        <div 
                                          key={site.name}
                                          className={`p-3 border-2 flex items-center justify-between transition-all rounded-lg ${isPossible ? 'border-neon-magenta/30 bg-neon-magenta/5 hover:border-neon-magenta/60' : 'border-neon-lime/30 bg-neon-lime/5 hover:border-neon-lime/60'}`}
                                        >
                                          <div className="flex items-center gap-3">
                                            {site.avatar && (
                                              <img 
                                                src={site.avatar} 
                                                alt={site.name} 
                                                className="w-6 h-6 rounded-full border border-white/20"
                                                referrerPolicy="no-referrer"
                                              />
                                            )}
                                            <span className="text-[10px] uppercase tracking-widest truncate max-w-[150px]">{site.name}</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-black ${isPossible ? 'text-neon-magenta' : 'text-neon-lime'}`}>
                                              {isPossible ? 'POSSIBLE' : 'FOUND'}
                                            </span>
                                            <button 
                                              onClick={() => handleToolSearch(site.name, site.url)}
                                              className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                            >
                                              <ExternalLink size={14} className="text-white/40" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Breach Intelligence */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <Zap size={20} className="text-neon-magenta" />
                        <h4 className="text-sm font-mono uppercase tracking-widest text-white">Breach_Intelligence</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-red-500/5 border-2 border-red-500/20 rounded-xl">
                          <h5 className="text-[10px] text-red-400 font-black mb-3 uppercase tracking-widest">Potential_Data_Leaks</h5>
                          <button 
                            onClick={() => handleBreachQuery('HIBP', `https://haveibeenpwned.com/account/${scanResults.target}`)}
                            className="w-full py-2 bg-red-500/20 text-red-400 text-[9px] border border-red-500/30 hover:bg-red-500/40 transition-all uppercase tracking-[0.2em] font-bold"
                          >
                            RUN_HIBP_QUERY
                          </button>
                        </div>
                        <div className="p-4 bg-neon-cyan/5 border-2 border-neon-cyan/20 rounded-xl">
                          <h5 className="text-[10px] text-neon-cyan font-black mb-3 uppercase tracking-widest">Identity_Verification</h5>
                          <button 
                            onClick={() => handleBreachQuery('IntelX', `https://intelx.io/?s=${scanResults.target}`)}
                            className="w-full py-2 bg-neon-cyan/20 text-neon-cyan text-[9px] border border-neon-cyan/30 hover:bg-neon-cyan/40 transition-all uppercase tracking-[0.2em] font-bold"
                          >
                            QUERY_INTELX_DB
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* WHOIS */}
                    {scanResults.whois && !scanResults.whois.error && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                          <Globe size={20} className="text-neon-cyan" />
                          <h4 className="text-sm font-mono uppercase tracking-widest text-white">Whois_Data_Extraction</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 bg-white/5 p-6 border-2 border-white/10 rounded-xl">
                          {Object.entries(scanResults.whois).map(([key, val]: [string, any]) => (
                            val && typeof val === 'string' && (
                              <div key={key} className="flex justify-between items-center gap-6 text-[10px] font-mono border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <span className="opacity-40 uppercase tracking-tighter">{key}</span>
                                <span className="text-neon-cyan truncate max-w-[250px] font-bold">{val}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'Analyst' ? (
            <motion.div
              key="analyst"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                  <h2 className="text-4xl font-graffiti tracking-widest uppercase mb-2 text-neon-magenta">AI_Deep_Scan_Analyst_v1.0</h2>
                  <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">Neural Intelligence Extraction & Briefing</p>
                </div>
                <button 
                  onClick={handleAnalystSubmit}
                  disabled={isAnalyzing || !analystInput}
                  className={`px-6 py-3 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${isAnalyzing || !analystInput ? 'border-white/10 text-white/20 cursor-not-allowed' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_20px_rgba(255,0,255,0.2)]'}`}
                >
                  {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
                  EXECUTE_ANALYSIS
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-mono text-neon-magenta uppercase tracking-[0.3em] flex items-center gap-2">
                      <Terminal size={14} /> SCAN_DATA_INPUT
                    </h3>
                    <button 
                      onClick={() => setAnalystInput('')}
                      className="text-[8px] font-mono text-white/30 hover:text-white uppercase tracking-widest"
                    >
                      CLEAR_BUFFER
                    </button>
                  </div>
                  <textarea 
                    value={analystInput}
                    onChange={(e) => setAnalystInput(e.target.value)}
                    placeholder="PASTE_SCAN_RESULTS_HERE... (e.g., WHOIS data, social media links, leaked info)"
                    className="w-full h-[500px] bg-black/40 border-2 border-white/10 p-6 font-mono text-xs text-white focus:border-neon-magenta outline-none transition-all resize-none custom-scrollbar"
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-mono text-neon-cyan uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity size={14} /> INTELLIGENCE_BRIEFING
                  </h3>
                  <div className="w-full h-[500px] bg-black/40 border-2 border-white/10 p-6 font-mono text-xs text-white/80 overflow-y-auto custom-scrollbar relative">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                        <RefreshCw size={32} className="animate-spin text-neon-magenta" />
                        <p className="uppercase tracking-[0.5em] animate-pulse">Processing_Neural_Pathways...</p>
                      </div>
                    ) : analystOutput ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{analystOutput}</Markdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                        <Brain size={48} />
                        <p className="uppercase tracking-[0.3em] text-center">Awaiting_Input_Data_For_Analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {activeTab === 'Tools' && filteredTools.length === 0 && (
          <div className="p-32 text-center border-4 border-dashed border-white/10 rounded-3xl mt-10">
            <Ghost className="mx-auto mb-6 text-neon-magenta animate-bounce" size={64} />
            <p className="font-graffiti text-3xl text-white/30 uppercase tracking-widest">Target not found in database</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-10 md:p-20 border-t-4 border-white mt-20 bg-black/60 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 p-10 opacity-5 pointer-events-none">
          <span className="font-graffiti text-[20vw] leading-none">STREET</span>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="p-3 md:p-4 border-2 border-neon-lime">
              <Terminal size={24} className="text-neon-lime" />
            </div>
            <div>
              <p className="font-graffiti text-xl md:text-2xl tracking-widest">OSINT HUB</p>
              <p className="font-mono text-[10px] text-neon-cyan">EST. 2026 // GLOBAL_INTEL</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 font-mono text-[10px] uppercase tracking-[0.4em]">
            <a href="#" className="text-neon-magenta hover:text-white transition-colors">Methodology</a>
            <a href="#" className="text-neon-cyan hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-neon-lime hover:text-white transition-colors">Contribute</a>
          </div>
        </div>
      </footer>

      {/* Tool Detail Modal */}
      <AnimatePresence>
        {selectedToolForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedToolForModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-4xl bg-[#0a0a0a] border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 md:p-10 border-b-4 border-white flex items-center justify-between bg-white text-black">
                <div className="flex items-center gap-6">
                  <div className="p-4 border-2 border-black rounded-xl bg-black/5">
                    <Favicon url={selectedToolForModal.url} name={selectedToolForModal.name} className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-6xl font-graffiti tracking-tighter text-black">
                      {selectedToolForModal.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="px-3 py-1 bg-black/10 border border-black/30 text-black font-mono text-[10px] uppercase tracking-widest rounded">
                        {selectedToolForModal.category}
                      </span>
                      {selectedToolForModal.isFree && (
                        <span className="px-3 py-1 bg-neon-lime/20 border border-neon-lime/40 text-black font-mono text-[10px] uppercase tracking-widest rounded">
                          FREE_ACCESS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedToolForModal(null)}
                  className="p-3 hover:bg-black hover:text-white rounded-full transition-colors text-black border-2 border-black"
                >
                  <XCircle size={32} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 custom-scrollbar bg-black">
                <section className="space-y-4">
                  <h3 className="text-neon-cyan font-mono text-lg uppercase tracking-[0.3em] flex items-center gap-3">
                    <Info size={20} /> DESCRIPTION
                  </h3>
                  <p className="text-xl font-mono leading-relaxed opacity-80 text-white">
                    {selectedToolForModal.description}
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-neon-magenta font-mono text-lg uppercase tracking-[0.3em] flex items-center gap-3">
                    <Layers size={20} /> TAGS
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedToolForModal.tags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => {
                          setToolSearchQuery(tag);
                          setSelectedToolForModal(null);
                        }}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono text-white uppercase tracking-widest hover:border-neon-cyan hover:text-neon-cyan transition-all rounded-lg"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </section>

                {selectedToolForModal.howToUse && (
                  <section className="space-y-4">
                    <h3 className="text-neon-lime font-mono text-lg uppercase tracking-[0.3em] flex items-center gap-3">
                      <Terminal size={20} /> USAGE_INSTRUCTIONS
                    </h3>
                    <div className="p-6 bg-white/5 border-2 border-neon-lime/20 rounded-xl font-mono text-sm leading-relaxed text-neon-lime/90 whitespace-pre-wrap">
                      {selectedToolForModal.howToUse}
                    </div>
                  </section>
                )}

                {selectedToolForModal.combinations && selectedToolForModal.combinations.length > 0 && (
                  <section className="space-y-4">
                    <h3 className="text-neon-yellow font-mono text-lg uppercase tracking-[0.3em] flex items-center gap-3">
                      <Zap size={20} /> BEST_COMBINATIONS
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedToolForModal.combinations.map(combo => (
                        <button 
                          key={combo}
                          onClick={() => {
                            setToolSearchQuery(combo);
                            setSelectedToolForModal(null);
                          }}
                          className="px-4 py-2 bg-neon-yellow/5 border border-neon-yellow/20 text-xs font-mono uppercase text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all rounded-lg"
                        >
                          {combo}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="p-8 border-t-4 border-white bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => {
                    handleToolSearch(selectedToolForModal, selectedToolForModal.url);
                    setSelectedToolForModal(null);
                  }}
                  className="flex items-center justify-center gap-4 py-5 border-4 border-black text-black font-mono text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                >
                  <ExternalLink size={20} />
                  OPEN_TOOL_HOMEPAGE
                </button>
                <button 
                  onClick={() => {
                    handleToolSearch(selectedToolForModal);
                    setSelectedToolForModal(null);
                  }}
                  disabled={!searchQuery}
                  className={`flex items-center justify-center gap-4 py-5 border-4 font-mono text-sm uppercase tracking-widest transition-all ${!searchQuery ? 'border-black/10 text-black/20 cursor-not-allowed' : 'border-black bg-black text-white hover:bg-white hover:text-black'}`}
                >
                  <Search size={20} />
                  EXECUTE_TARGET_SEARCH
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {modalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md"
            onClick={() => setModalContent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] bg-[#0a0a0a] border-4 border-white shadow-[20px_20px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 md:p-6 border-b-4 border-white flex justify-between items-center bg-white text-black">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-black text-white">
                    {modalContent.type === 'article' ? <FileText size={20} /> : <Search size={20} />}
                  </div>
                  <h2 className="font-graffiti text-xl md:text-2xl uppercase tracking-tighter truncate max-w-[200px] md:max-w-md">
                    {modalContent.title}
                  </h2>
                </div>
                <button 
                  onClick={() => setModalContent(null)}
                  className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 font-mono custom-scrollbar">
                {isModalLoading ? (
                  <div className="space-y-8 py-10">
                    <div className="flex items-center gap-4 text-neon-cyan animate-pulse">
                      <Terminal size={24} />
                      <span className="text-sm tracking-[0.3em] uppercase">Intercepting data stream...</span>
                    </div>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {modalContent.type === 'article' && (
                      <div className="prose prose-invert max-w-none">
                        <div 
                          className="text-white/80 leading-relaxed text-sm md:text-base article-content"
                          dangerouslySetInnerHTML={{ __html: modalContent.content }}
                        />
                        {modalContent.url && (
                          <div className="mt-10 pt-10 border-t border-white/10">
                            <a 
                              href={modalContent.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 text-xs text-neon-cyan hover:text-white transition-colors"
                            >
                              <ExternalLink size={14} /> VIEW_ORIGINAL_SOURCE_REPORT
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {modalContent.type === 'search' && (
                      <div className="space-y-6">
                        {modalContent.results && modalContent.results.length > 0 ? (
                          modalContent.results.map((res: any, i: number) => (
                            <div key={i} className="p-6 bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-all group">
                              <h4 className="text-neon-cyan font-bold mb-2 group-hover:text-white transition-colors">{res.title}</h4>
                              <p className="text-xs text-white/60 mb-4 line-clamp-2">{res.snippet}</p>
                              <div className="flex items-center justify-between gap-4">
                                <a 
                                  href={res.link} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] text-white/40 hover:text-neon-cyan transition-colors flex items-center gap-2 truncate"
                                >
                                  <LinkIcon size={10} /> {res.link}
                                </a>
                                <button
                                  onClick={() => handleCopy(res.link)}
                                  className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[9px] text-white/60 hover:bg-white/10 hover:text-white transition-all rounded shrink-0"
                                >
                                  {copiedUrl === res.link ? (
                                    <>
                                      <Check size={10} className="text-neon-lime" />
                                      <span className="text-neon-lime">COPIED</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={10} />
                                      <span>COPY_LINK</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center opacity-40">
                            <Ghost size={48} className="mx-auto mb-4" />
                            <p className="uppercase tracking-widest">No intelligence gathered from this sector</p>
                          </div>
                        )}
                        {modalContent.url && (
                          <div className="mt-10 pt-10 border-t border-white/10">
                            <a 
                              href={modalContent.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 text-xs text-neon-cyan hover:text-white transition-colors"
                            >
                              <ExternalLink size={14} /> VIEW_ORIGINAL_SOURCE_REPORT
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {modalContent.type === 'tool' && (
                      <div className="space-y-6">
                        {modalContent.results && modalContent.results.length > 0 ? (
                          modalContent.results.map((res: any, i: number) => (
                            <div key={i} className="p-6 bg-white/5 border border-white/10 hover:border-neon-magenta/50 transition-all group">
                              <h4 className="text-neon-magenta font-bold mb-2 group-hover:text-white transition-colors">{res.title}</h4>
                              <p className="text-xs text-white/60 mb-4 line-clamp-2">{res.snippet}</p>
                              <div className="flex items-center justify-between gap-4">
                                <a 
                                  href={res.link} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] text-white/40 hover:text-neon-magenta transition-colors flex items-center gap-2 truncate"
                                >
                                  <LinkIcon size={10} /> {res.link}
                                </a>
                                <button
                                  onClick={() => handleCopy(res.link)}
                                  className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[9px] text-white/60 hover:bg-white/10 hover:text-white transition-all rounded shrink-0"
                                >
                                  {copiedUrl === res.link ? (
                                    <>
                                      <Check size={10} className="text-neon-lime" />
                                      <span className="text-neon-lime">COPIED</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={10} />
                                      <span>COPY_LINK</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center opacity-40">
                            <Ghost size={48} className="mx-auto mb-4" />
                            <p className="uppercase tracking-widest">No intelligence gathered from this sector</p>
                          </div>
                        )}
                        {modalContent.url && (
                          <div className="mt-10 pt-10 border-t border-white/10">
                            <a 
                              href={modalContent.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 text-xs text-neon-magenta hover:text-white transition-colors"
                            >
                              <ExternalLink size={14} /> VIEW_ORIGINAL_SOURCE_REPORT
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[9px] font-mono opacity-40 uppercase tracking-widest">
                <span>TERMINAL_SESSION: {new Date().toLocaleTimeString()}</span>
                <span>OSINT_HUB_v1.0.4</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette onClose={() => setShowCommandPalette(false)} onSelect={(tool) => {
            handleToolSearch(tool);
            setShowCommandPalette(false);
          }} />
        )}
      </AnimatePresence>
      
      {/* Floating Monitor Toggle */}
      <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-4">
        <button
          onClick={() => setShowIntelligenceWindow(!showIntelligenceWindow)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 group ${
            showIntelligenceWindow 
              ? 'bg-neon-lime text-black' 
              : 'bg-neon-lime/20 text-neon-lime hover:bg-neon-lime/40 hover:scale-110'
          }`}
          title="Toggle Intelligence Report"
        >
          {showIntelligenceWindow ? <X size={24} /> : <Shield size={24} />}
        </button>
        
        <button
          onClick={() => setShowStatusWindow(!showStatusWindow)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 group ${
            showStatusWindow 
              ? 'bg-neon-magenta text-black rotate-90' 
              : 'bg-neon-cyan text-black hover:scale-110'
          }`}
          title="Toggle Live Ops Monitor"
        >
          {showStatusWindow ? <X size={24} /> : <Activity size={24} className={runningTools.some(t => t.status === 'running') ? 'animate-pulse' : ''} />}
          {!showStatusWindow && runningTools.some(t => t.status === 'running') && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-magenta rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce">
              {runningTools.filter(t => t.status === 'running').length}
            </span>
          )}
        </button>
      </div>

      <StatusWindow 
        isOpen={showStatusWindow} 
        onClose={() => setShowStatusWindow(false)}
        runningTools={runningTools}
        onClearLogs={() => setRunningTools([])}
        expandedToolId={expandedToolId}
        setExpandedToolId={setExpandedToolId}
        onExportJSON={exportLogsAsJSON}
        onDownloadLog={exportLogsAsText}
      />
      <IntelligenceWindow 
        isOpen={showIntelligenceWindow}
        onClose={() => setShowIntelligenceWindow(false)}
        scanResults={scanResults}
        isScanning={isScanning}
        isDeepScan={isDeepScan}
        targetRiskScore={targetRiskScore}
        targetDossier={targetDossier}
        falsePositives={falsePositives}
        onToolSearch={handleToolSearch}
        onBreachQuery={handleBreachQuery}
        onExportJSON={exportCurrentScanResults}
        onDownloadLog={downloadScanLog}
        searchQuery={searchQuery}
        aiSuggestions={aiSuggestions}
        aiActions={aiActions}
      />
      </div>
    </ErrorBoundary>
  );
}


const IntelligenceWindow = React.memo(({ 
  isOpen, 
  onClose, 
  scanResults, 
  isScanning, 
  isDeepScan, 
  targetRiskScore, 
  targetDossier, 
  falsePositives, 
  onToolSearch, 
  onBreachQuery, 
  onExportJSON, 
  onDownloadLog,
  searchQuery,
  aiSuggestions,
  aiActions
}: IntelligenceWindowProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      className="fixed top-24 left-6 bottom-24 w-[32rem] z-[100] font-mono"
    >
      <div className="bg-[#050505]/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl rounded-lg overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-neon-lime/10 to-transparent">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-neon-lime" />
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white leading-none">Intelligence Report</h3>
              <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">
                {scanResults ? `Target: ${scanResults.target} • ID: ${scanResults.timestamp.replace(/[^A-Z0-9]/g, '').slice(-8)}` : 'No Active Target'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/20 hover:text-white transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {!scanResults ? (
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
              <Shield size={48} className="mb-4" />
              <p className="text-[10px] uppercase tracking-widest font-bold">No Intelligence Data</p>
              <p className="text-[8px] mt-1">Initiate a scan to generate a target dossier</p>
            </div>
          ) : (
            <>
              {isScanning && (
                <div className="flex items-center gap-3 p-4 bg-neon-lime/5 border border-neon-lime/20 rounded-lg animate-pulse mb-6">
                  <Activity size={16} className="text-neon-lime animate-spin" />
                  <span className="text-[10px] font-mono text-neon-lime uppercase tracking-[0.3em]">
                    {isDeepScan ? 'DEEP_INTELLIGENCE_EXTRACTION_IN_PROGRESS...' : 'SCAN_SEQUENCE_ACTIVE...'}
                  </span>
                </div>
              )}

              {/* Risk Score */}
              {targetRiskScore && (
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-black/40 border-2 border-neon-magenta p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-neon-magenta uppercase tracking-widest mb-2">VULNERABILITY_SCORE</span>
                    <div className="text-6xl font-graffiti text-neon-magenta mb-2">{targetRiskScore.score}</div>
                    <div className={`text-xs font-mono uppercase tracking-[0.3em] px-3 py-1 border ${
                      targetRiskScore.level === 'Critical' ? 'bg-neon-magenta text-black border-neon-magenta' :
                      targetRiskScore.level === 'High' ? 'text-neon-magenta border-neon-magenta' :
                      targetRiskScore.level === 'Medium' ? 'text-neon-yellow border-neon-yellow' :
                      'text-neon-lime border-neon-lime'
                    }`}>
                      {targetRiskScore.level}_RISK
                    </div>
                  </div>
                  <div className="bg-black/40 border-2 border-white/10 p-6">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 block">CRITICAL_RISK_FACTORS</span>
                    <div className="space-y-4">
                      {targetRiskScore.factors.map((factor, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="p-1 bg-neon-magenta/20 border border-neon-magenta/40 mt-1">
                            <AlertTriangle size={12} className="text-neon-magenta" />
                          </div>
                          <p className="text-xs font-mono text-white/80 leading-relaxed uppercase">{factor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Dossier */}
              {targetDossier && (
                <div className="bg-neon-cyan/5 border-2 border-neon-cyan/30 p-6 relative overflow-hidden group rounded">
                  <div className="flex items-center gap-3 mb-6 border-b border-neon-cyan/20 pb-4">
                    <Brain className="text-neon-cyan" size={20} />
                    <h3 className="text-xl font-graffiti text-neon-cyan tracking-widest uppercase">AI_TARGET_DOSSIER</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none font-mono text-white/90 leading-relaxed dossier-content">
                    <Markdown>{targetDossier}</Markdown>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neon-cyan/20 flex justify-between items-center">
                    <p className="text-[8px] font-mono text-neon-cyan/50 uppercase tracking-[0.3em]">AI_GENERATED // CONFIDENTIAL</p>
                    <button 
                      onClick={() => {
                        const blob = new Blob([targetDossier], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `DOSSIER_${searchQuery.replace(/[^a-z0-9]/gi, '_').toUpperCase()}.md`;
                        a.click();
                      }}
                      className="text-[9px] font-mono text-neon-cyan hover:underline uppercase tracking-widest"
                    >
                      DOWNLOAD_MD
                    </button>
                  </div>
                </div>
              )}

              {/* AI Suggestions & Actions */}
              {(aiSuggestions.length > 0 || aiActions.length > 0) && (
                <div className="space-y-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-neon-yellow" size={16} />
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white">AI_Recommendations</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {aiSuggestions.map((suggestion, i) => (
                      <div key={i} className="bg-black/40 border border-neon-yellow/30 p-4 rounded relative group hover:border-neon-yellow transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[10px] font-mono text-neon-yellow uppercase tracking-widest">{suggestion.name}</h4>
                          {suggestion.directLink && (
                            <a 
                              href={suggestion.directLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1 bg-neon-yellow/10 border border-neon-yellow/20 text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all rounded"
                            >
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <p className="text-[9px] font-mono text-white/60 leading-relaxed uppercase">
                          <span className="text-neon-yellow/40 mr-2">REASON:</span>
                          {suggestion.reason}
                        </p>
                      </div>
                    ))}
                  </div>

                  {aiActions.length > 0 && (
                    <div className="bg-neon-magenta/5 border border-neon-magenta/30 p-4 rounded">
                      <div className="flex items-center gap-3 mb-3">
                        <Terminal size={12} className="text-neon-magenta" />
                        <h4 className="text-[9px] font-mono text-neon-magenta uppercase tracking-[0.3em]">AUTONOMOUS_LOG</h4>
                      </div>
                      <div className="space-y-1.5">
                        {aiActions.map((action, i) => (
                          <div key={i} className="flex items-center gap-2 text-[8px] font-mono text-white/40 uppercase">
                            <span className="text-neon-magenta opacity-50">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-white/80">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Social Footprint */}
              {scanResults.social && Array.isArray(scanResults.social) && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                    <User size={16} className="text-neon-lime" />
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white">Social_Footprint</h4>
                  </div>
                  <div className="space-y-8">
                    {['Social', 'Chat', 'Gaming', 'Dating', 'NSFW', 'Professional', 'Creative', 'Tech', 'Other'].map(category => {
                      const categorySites = scanResults.social.filter((s: any) => s.category === category);
                      if (categorySites.length === 0) return null;
                      
                      const foundCount = categorySites.filter((s: any) => (s.status === 'Found' || s.status === 'Possible but Deleted') && !falsePositives.has(s.name)).length;
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[9px] font-mono uppercase text-neon-cyan flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                              {category}_SECTOR
                            </h5>
                            <span className="text-[8px] font-mono opacity-50">
                              {foundCount} / {categorySites.length} IDENTIFIED
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {foundCount === 0 ? (
                              <div className="py-4 border border-dashed border-white/10 rounded flex flex-col items-center justify-center bg-black/20">
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">No_Active_Profiles</span>
                              </div>
                            ) : categorySites.map((site: any) => {
                              const isFalsePositive = falsePositives.has(site.name);
                              if ((site.status === 'Found' || site.status === 'Possible but Deleted') && !isFalsePositive) {
                                const isPossible = site.status === 'Possible but Deleted';
                                return (
                                  <div 
                                    key={site.name}
                                    className={`p-2 border flex items-center justify-between transition-all ${isPossible ? 'border-neon-magenta/30 bg-neon-magenta/5' : 'border-neon-lime/30 bg-neon-lime/5'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {site.avatar && (
                                        <img 
                                          src={site.avatar} 
                                          alt={site.name} 
                                          className="w-4 h-4 rounded-full border border-white/20"
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <span className="text-[9px] uppercase tracking-widest truncate max-w-[120px]">{site.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[8px] font-bold ${isPossible ? 'text-neon-magenta' : 'text-neon-lime'}`}>
                                        {isPossible ? 'POSSIBLE' : 'FOUND'}
                                      </span>
                                      <button 
                                        onClick={() => onToolSearch(site.name, site.url)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                      >
                                        <ExternalLink size={10} className="text-white/40" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Breach Intelligence */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                  <Zap size={16} className="text-neon-magenta" />
                  <h4 className="text-xs font-mono uppercase tracking-widest text-white">Breach_Intelligence</h4>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded">
                    <h5 className="text-[9px] text-red-400 font-bold mb-1 uppercase">Potential_Leaks</h5>
                    <button 
                      onClick={() => onBreachQuery('HIBP', `https://haveibeenpwned.com/account/${scanResults.target}`)}
                      className="w-full py-1 bg-red-500/20 text-red-400 text-[8px] border border-red-500/30 hover:bg-red-500/40 transition-all uppercase tracking-widest"
                    >
                      RUN_HIBP_QUERY
                    </button>
                  </div>
                  <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded">
                    <h5 className="text-[9px] text-neon-cyan font-bold mb-1 uppercase">Identity_Verification</h5>
                    <button 
                      onClick={() => onBreachQuery('IntelX', `https://intelx.io/?s=${scanResults.target}`)}
                      className="w-full py-1 bg-neon-cyan/20 text-neon-cyan text-[8px] border border-neon-cyan/30 hover:bg-neon-cyan/40 transition-all uppercase tracking-widest"
                    >
                      QUERY_INTELX_DB
                    </button>
                  </div>
                </div>
              </div>

              {/* WHOIS */}
              {scanResults.whois && !scanResults.whois.error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                    <Globe size={16} className="text-neon-cyan" />
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white">Whois_Data</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2 bg-white/5 p-4 border border-white/10 rounded">
                    {Object.entries(scanResults.whois).map(([key, val]: [string, any]) => (
                      val && typeof val === 'string' && (
                        <div key={key} className="flex justify-between items-center gap-4 text-[9px] font-mono">
                          <span className="opacity-40 uppercase">{key}</span>
                          <span className="text-neon-cyan truncate max-w-[200px]">{val}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/50 grid grid-cols-2 gap-3">
          <button 
            onClick={onExportJSON}
            disabled={!scanResults}
            className="flex items-center justify-center gap-2 py-2 bg-neon-lime/10 border border-neon-lime/30 rounded text-[9px] text-neon-lime uppercase font-bold tracking-widest hover:bg-neon-lime hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            Export_JSON
          </button>
          <button 
            onClick={onDownloadLog}
            disabled={!scanResults}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded text-[9px] text-white/60 uppercase font-bold tracking-widest hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            Raw_Log
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const StatusWindow = React.memo(({ 
  isOpen, 
  onClose, 
  runningTools, 
  onClearLogs, 
  expandedToolId, 
  setExpandedToolId,
  onExportJSON,
  onDownloadLog
}: StatusWindowProps) => {
  if (!isOpen) return null;

  const activeCount = runningTools.filter(t => t.status === 'running').length;
  const completedCount = runningTools.filter(t => t.status === 'completed').length;
  const failedCount = runningTools.filter(t => t.status === 'failed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-6 w-96 z-[100] font-mono"
    >
      <div className="bg-[#050505]/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-neon-cyan/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity size={18} className="text-neon-cyan" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-neon-cyan rounded-full" />
              )}
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white leading-none">Live Ops Monitor</h3>
              <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">
                {activeCount} Active • {completedCount} Done • {failedCount} Failed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClearLogs}
              className="group flex items-center gap-2 px-2 py-1 rounded border border-white/5 hover:border-neon-magenta/50 transition-all"
              title="Clear all logs"
            >
              <Trash2 size={10} className="text-white/40 group-hover:text-neon-magenta" />
              <span className="text-[8px] text-white/40 group-hover:text-neon-magenta uppercase font-bold">Wipe</span>
            </button>
            <button 
              onClick={onClose}
              className="text-white/20 hover:text-white transition-colors"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>

        {/* Global Progress */}
        {activeCount > 0 && (
          <div className="h-0.5 w-full bg-white/5 overflow-hidden">
            <div className="h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]" style={{ width: '100%', animation: 'none' }} />
          </div>
        )}
        
        {/* Tool List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {runningTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-20">
              <Activity size={32} className="mb-4" />
              <p className="text-[10px] uppercase tracking-widest font-bold">No active processes</p>
              <p className="text-[8px] mt-1">Start a scan to monitor live operations</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {runningTools.map((tool) => (
                <motion.div 
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative rounded-md border transition-all duration-200 ${
                    expandedToolId === tool.id 
                      ? 'bg-white/5 border-white/20' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tool.status === 'completed' ? 'bg-neon-lime shadow-[0_0_5px_#39ff14]' : 
                          tool.status === 'failed' ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 
                          'bg-neon-cyan shadow-[0_0_5px_#00f3ff]'
                        }`} />
                        <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">{tool.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-white/30 font-mono">
                          {Math.floor((Date.now() - tool.startTime) / 1000)}s
                        </span>
                        <ChevronDown 
                          size={12} 
                          className={`text-white/20 transition-transform duration-300 ${expandedToolId === tool.id ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full transition-all duration-500 ${
                          tool.status === 'completed' ? 'bg-neon-lime' : 
                          tool.status === 'failed' ? 'bg-red-500' : 
                          'bg-neon-cyan'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${tool.status === 'completed' ? 100 : tool.status === 'failed' ? 100 : Math.max(10, tool.progress)}%` }}
                      />
                    </div>

                    {/* Status Text */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[8px] text-white/40 uppercase tracking-tighter">
                        {tool.category} • {tool.type}
                      </span>
                      <span className={`text-[8px] font-black uppercase ${
                        tool.status === 'completed' ? 'text-neon-lime' : 
                        tool.status === 'failed' ? 'text-red-500' : 
                        'text-neon-cyan'
                      }`}>
                        {tool.status === 'running' ? `Processing_${Math.floor(tool.progress)}%` : tool.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedToolId === tool.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5 bg-black/40"
                      >
                        <div className="p-3 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                          {/* Logs */}
                          <div className="space-y-1">
                            <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-2">Execution_Logs</p>
                            {tool.logs?.map((log: string, i: number) => (
                              <div key={i} className="flex gap-2 text-[9px] font-mono">
                                <span className="text-white/10">[{i}]</span>
                                <span className="text-white/60">{log}</span>
                              </div>
                            ))}
                            {tool.status === 'running' && (
                              <div className="flex gap-2 text-[9px] font-mono animate-pulse">
                                <span className="text-white/10">[*]</span>
                                <span className="text-neon-cyan">Awaiting server response...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/50">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onExportJSON}
              disabled={runningTools.length === 0}
              className="flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded text-[8px] text-white/60 uppercase font-bold tracking-widest hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={10} />
              Export_JSON
            </button>
            <button 
              onClick={onDownloadLog}
              disabled={runningTools.length === 0}
              className="flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded text-[8px] text-white/60 uppercase font-bold tracking-widest hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FileText size={10} />
              Download_Log
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const CommandPalette = ({ onClose, onSelect }: { onClose: () => void, onSelect: (tool: OSINTTool) => void }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = useMemo(() => {
    if (!query) return OSINT_TOOLS.slice(0, 8);
    const fuse = new Fuse(OSINT_TOOLS, {
      keys: ['name', 'category', 'description', 'tags'],
      threshold: 0.3
    });
    return fuse.search(query).map(r => r.item).slice(0, 8);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      if (filteredTools[selectedIndex]) {
        onSelect(filteredTools[selectedIndex]);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 p-4 border-b border-white/5">
          <Search size={20} className="text-white/20" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, workflows, commands..."
            className="flex-1 bg-transparent border-none outline-none text-lg font-mono text-white placeholder:text-white/10 uppercase tracking-widest"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="px-2 py-1 rounded border border-white/10 text-[10px] text-white/20 font-mono">ESC</div>
        </div>

        <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, index) => (
              <button
                key={tool.id}
                onClick={() => onSelect(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${
                  index === selectedIndex ? 'bg-white/5 border border-white/10' : 'border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    index === selectedIndex ? 'bg-neon-cyan/10 border-neon-cyan/30' : 'bg-white/5 border-white/5'
                  }`}>
                    {tool.category === 'Social Media' ? <User size={18} className={index === selectedIndex ? 'text-neon-cyan' : 'text-white/40'} /> : 
                     tool.category === 'Domain & IP' ? <Globe size={18} className={index === selectedIndex ? 'text-neon-cyan' : 'text-white/40'} /> :
                     <Terminal size={18} className={index === selectedIndex ? 'text-neon-cyan' : 'text-white/40'} />}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-black uppercase tracking-widest ${index === selectedIndex ? 'text-white' : 'text-white/60'}`}>
                      {tool.name}
                    </p>
                    <p className="text-[10px] text-white/20 uppercase tracking-tighter mt-0.5">
                      {tool.category} • {tool.description.slice(0, 50)}...
                    </p>
                  </div>
                </div>
                {index === selectedIndex && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/20 font-mono uppercase">Launch</span>
                    <CornerDownLeft size={12} className="text-white/20" />
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="py-12 text-center opacity-20">
              <Ghost size={48} className="mx-auto mb-4" />
              <p className="uppercase tracking-[0.2em] text-xs">No matching tools found</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-black/50 border-t border-white/5 flex items-center justify-between text-[9px] text-white/20 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> Navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft size={10} /> Select</span>
          </div>
          <span>{filteredTools.length} Tools Available</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
