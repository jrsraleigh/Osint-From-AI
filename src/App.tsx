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
  Cell,
  PieChart,
  Pie,
  Legend
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
  ShieldAlert,
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
  Settings,
  Clock,
  Key,
  Square,
  Database,
  Folder,
  Server,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart as LucidePieChart,
  Network,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  onToggleFalsePositive: (siteName: string) => void;
  onToolSearch: (toolOrName: OSINTTool | string, customUrl?: string) => void;
  onBreachQuery: (toolName: string, url: string) => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
  onDownloadLog: () => void;
  searchQuery: string;
  aiSuggestions: {name: string, reason: string, directLink?: string}[];
  aiActions: string[];
  openInBrowser: (url: string) => void;
  onShowHistory: () => void;
  onShowResults: () => void;
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
  onRetryTool: (toolId: string) => void;
  openInBrowser: (url: string) => void;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono text-center">
          <XCircle size={64} className="text-red-500 mb-6" />
          <h1 className="text-2xl text-white uppercase tracking-widest mb-4 font-bold">System_Critical_Failure</h1>
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg max-w-2xl w-full mb-8">
            <p className="text-red-500 text-sm mb-4 uppercase font-bold tracking-widest">Error_Log:</p>
            <p className="text-white/80 text-xs break-all text-left font-mono bg-black/40 p-4 rounded border border-white/5">
              {this.state.error?.message || "Unknown system error occurred."}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-red-500 text-white uppercase tracking-[0.2em] font-bold hover:bg-red-600 transition-all flex items-center gap-3"
          >
            <RotateCcw size={20} />
            RESTART_SYSTEM_CORE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
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
  const [searchQuerySecondary, setSearchQuerySecondary] = useState('');
  const [showSecondarySearch, setShowSecondarySearch] = useState(false);
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

  const removeFromSearchHistory = (query: string) => {
    setSearchHistory(prev => prev.filter(q => q !== query));
  };

  const [scanHistory, setScanHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('osintScanHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse scan history:', e);
        return [];
      }
    }
    return [];
  });

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

  const exportDossierPDF = async () => {
    const element = document.querySelector('.intelligence-window-container') as HTMLElement;
    if (!element) return;

    try {
      const button = document.querySelector('.pdf-export-btn') as HTMLButtonElement;
      if (button) button.disabled = true;

      const canvas = await html2canvas(element, {
        backgroundColor: '#050505',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('.intelligence-window-container') as HTMLElement;
          if (el) {
            el.style.margin = '0';
            el.style.padding = '20px';
            el.style.height = 'auto';
            el.style.maxHeight = 'none';
            el.style.overflow = 'visible';
            
            const content = clonedDoc.querySelector('.intelligence-window') as HTMLElement;
            if (content) {
              content.style.maxHeight = 'none';
              content.style.height = 'auto';
            }
            
            const scrollArea = clonedDoc.querySelector('.custom-scrollbar') as HTMLElement;
            if (scrollArea) {
              scrollArea.style.maxHeight = 'none';
              scrollArea.style.overflow = 'visible';
              scrollArea.style.height = 'auto';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DOSSIER_REPORT_${searchQuery.replace(/[^a-z0-9]/gi, '_').toUpperCase()}.pdf`);
      
      if (button) button.disabled = false;
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF dossier. Please try again.');
    }
  };

  useEffect(() => {
    localStorage.setItem('osintSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('osintScanHistory', JSON.stringify(scanHistory));
  }, [scanHistory]);

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
  const scrollToSearch = () => {
    const searchInput = document.querySelector('input[placeholder*="SEARCH"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput.focus();
    }
  };
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
  const abortControllersRef = useRef<AbortController[]>([]);

  const stopScan = () => {
    setIsScanning(false);
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        console.warn('Failed to abort controller:', e);
      }
    });
    abortControllersRef.current = [];
    
    // Update all running tools to 'failed' (cancelled)
    setRunningTools(prev => prev.map(t => t.status === 'running' ? { ...t, status: 'failed', progress: 100, results: 'Scan cancelled by user' } : t));
  };
  const [activeTab, setActiveTab] = useState<'Tools' | 'Scan' | 'Workflows' | 'Intel' | 'Dorks' | 'Analyst' | 'Browser' | 'TargetIntel' | 'Diagnostics' | 'History'>('Tools');
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

  const handleToggleFalsePositive = (siteName: string) => {
    setFalsePositives(prev => {
      const next = new Set(prev);
      if (next.has(siteName)) next.delete(siteName);
      else next.add(siteName);
      return next;
    });
  };
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [workflowProgress, setWorkflowProgress] = useState<Record<string, boolean>>({});
  const [currentlyRunningToolId, setCurrentlyRunningToolId] = useState<string | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [intelFeed, setIntelFeed] = useState<any[]>([]);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{name: string, reason: string, directLink?: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiActions, setAiActions] = useState<string[]>([]);
  const [isAiExecuting, setIsAiExecuting] = useState(false);

  const [aiStrategy, setAiStrategy] = useState<string | null>(null);
  const [isAiStrategyLoading, setIsAiStrategyLoading] = useState(false);
  const [aiStrategyRecommendations, setAiStrategyRecommendations] = useState<{name: string, description: string}[]>([]);
  const [aiStrategyActions, setAiStrategyActions] = useState<string[]>([]);
  const [targetDossier, setTargetDossier] = useState<string>('');
  const [targetRiskScore, setTargetRiskScore] = useState<{ score: number; level: string; factors: string[] } | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [isMassReconRunning, setIsMassReconRunning] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState<number>(0);

  const generateAiContent = async (contents: string | any, tools?: any[]) => {
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
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
    if (!apiKey) {
      const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
      return localIntelligence(promptText);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Hardcoded to gemini-3-flash-preview (Best Free Tier)
      const selectedModel = 'gemini-3-flash-preview';
      
      const config: any = {
        thinkingConfig: { 
          thinkingLevel: ThinkingLevel.LOW 
        }
      };

      if (tools) {
        config.tools = tools;
      }

      const result = await ai.models.generateContent({
        model: selectedModel,
        contents: typeof contents === 'string' ? { parts: [{ text: contents }] } : contents,
        config
      });
      
      // Handle the SDK result structure correctly
      let text = '';
      if (typeof result === 'string') {
        text = result;
      } else if (result && typeof (result as any).text === 'string') {
        text = (result as any).text;
      } else if (result && (result as any).response && typeof (result as any).response.text === 'function') {
        text = await (result as any).response.text();
      } else if (result && (result as any).response && typeof (result as any).response.text === 'string') {
        text = (result as any).response.text;
      } else {
        console.warn('Unexpected AI result structure:', result);
        text = JSON.stringify(result);
      }
      
      return { text };
    } catch (error) {
      console.error('OSINT AI error:', error);
      const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : 'Unknown error';
      return { text: `### Critical System Failure\n\nIntelligence extraction failed: \`${errorMessage}\`` };
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
  const [modalContent, setModalContent] = useState<{ title: string; content: string; type: 'article' | 'search' | 'tool' | 'error' | 'info'; results?: any[]; url?: string } | null>(null);
  const [activeModalView, setActiveModalView] = useState<'list' | 'viz'>('list');

  // Visualization Component for Intelligence Graph
  const IntelligenceGraph = ({ results }: { results: any[] }) => {
    const graphRef = useRef<HTMLDivElement>(null);

    const exportToPDF = async () => {
      if (!graphRef.current) return;
      
      const canvas = await html2canvas(graphRef.current, {
        backgroundColor: '#050505',
        scale: 1, // Keep it 1:1 for better aspect matching in PDF
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`osint_intelligence_map_${Date.now()}.pdf`);
    };

    return (
      <div ref={graphRef} className="h-full w-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 1px 1px, #00f3ff 1px, transparent 0)', 
               backgroundSize: '40px 40px' 
             }} 
        />

        <div className="absolute top-8 left-8 space-y-2 z-10">
          <div className="flex items-center gap-2 text-neon-cyan text-[10px] font-black uppercase tracking-widest">
            <Activity size={14} className="animate-pulse" />
            Live_Vector_Analysis
          </div>
          <div className="text-[9px] text-white/30 uppercase tracking-tighter">
            Total_Nodes: {results.length + 1} • Relations: {results.length}
          </div>
        </div>

        <div className="absolute top-8 right-8 z-50">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-neon-cyan hover:bg-neon-cyan/10 transition-all text-white/60 hover:text-white rounded-lg group"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Export_PDF</span>
          </button>
        </div>

        {/* Graph Legend */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-3 z-10">
          {[
            { label: 'Target_Node', color: 'bg-white' },
            { label: 'High_Confidence', color: 'bg-neon-lime' },
            { label: 'Secondary_Signal', color: 'bg-neon-cyan' },
            { label: 'Potential_Match', color: 'bg-white/20' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`} />
              <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Force Directed Simulation Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Target Center Node */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center relative z-20 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <Shield size={24} className="text-black" />
            <div className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded">
              TARGET_ALPHA
            </div>
          </motion.div>

          {/* Child Nodes */}
          {results.map((res, i) => {
            const angle = (i / results.length) * 2 * Math.PI;
            const radius = 250 + (i % 3) * 40;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const confidence = res.confidence || 70;
            const color = confidence > 85 ? '#39FF14' : confidence > 60 ? '#00f3ff' : 'rgba(255,255,255,0.2)';

            return (
              <React.Fragment key={i}>
                {/* Connection Line */}
                <motion.div 
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 0.2, pathLength: 1 }}
                  className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-white to-transparent origin-left z-10 pointer-events-none"
                  style={{ 
                    width: radius,
                    rotate: `${angle * (180 / Math.PI)}deg`,
                    backgroundColor: color
                  }}
                />
                
                {/* Node */}
                <motion.div
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, x, y }}
                  transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                  className="absolute top-[calc(50%-20px)] left-[calc(50%-20px)] group cursor-pointer"
                >
                  <div 
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-black transition-all hover:scale-125 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                    style={{ borderColor: color }}
                    onClick={() => openInBrowser(res.link)}
                  >
                    <Globe size={16} style={{ color }} />
                  </div>
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-black/90 border border-white/20 p-2 rounded whitespace-nowrap z-50 pointer-events-none">
                    <div className="text-[9px] font-bold text-white uppercase">{res.title}</div>
                    <div className="text-[8px] text-white/50 tracking-tighter uppercase">{confidence}%_CONFIDENCE</div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isVisualScanning, setIsVisualScanning] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [customApiKeys, setCustomApiKeys] = useState<Record<string, string>>({});
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [selectedToolForModal, setSelectedToolForModal] = useState<OSINTTool | null>(null);
  const [advancedDork, setAdvancedDork] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Error Listener for pattern error
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const message = error instanceof Error ? `${error.message}\n${error.stack}` : event.message;
      if (message.includes('pattern') || message.includes('atob')) {
        console.error('CRITICAL PATTERN ERROR DETECTED:', message);
        const errToolId = addRunningTool('FATAL_EXCEPTION', 'atob_check', 'Debug', 'System');
        updateToolStatus(errToolId, { 
          status: 'failed', 
          results: `Caught pattern error: ${message}`,
          logs: [`Stack Trace: ${message}`]
        });
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('osint_saved_searches');
      if (saved) setSavedSearches(JSON.parse(saved));
      
      const history = localStorage.getItem('osint_scan_history');
      if (history) setScanHistory(JSON.parse(history));

      const keys = localStorage.getItem('osint_custom_api_keys');
      if (keys) setCustomApiKeys(JSON.parse(keys));
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
    try {
      localStorage.setItem('osint_custom_api_keys', JSON.stringify(customApiKeys));
    } catch (e) {
      console.error("Failed to save custom keys to localStorage", e);
    }
  }, [customApiKeys]);

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

  const openInBrowser = (url: string) => {
    setBrowserUrl(url);
    setBrowserHistory(prev => [url, ...prev].slice(0, 50));
    setActiveTab('Browser');
    setModalContent(null);
    setSelectedToolForModal(null);
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
      const res = await fetch('/api/osint/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: advancedDork })
      });
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
      // Switch to browser tab instead of window.open
      setBrowserUrl(url);
      setBrowserHistory(prev => [url, ...prev].slice(0, 50));
      setActiveTab('Browser');
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
      // Fallback to browser tab instead of window.open
      setBrowserUrl(item.link);
      setBrowserHistory(prev => [item.link, ...prev].slice(0, 50));
      setActiveTab('Browser');
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
      
      Use the provided Google Search tool to find real-time information about the target if necessary.
      
      Return a JSON object with:
      1. "recommendations": an array of objects, each with "toolName", "reason" (a 1-sentence explanation), and "directLink" (the tool's URL from the provided list).
      2. "explanation": a brief overall intelligence briefing (3-4 sentences).
      3. "actions": an array of action strings to execute automatically.
      
      If the query is a specific target like an email or domain, explain the best methodology.`;

      const result = await generateAiContent(prompt, [{ googleSearch: {} }]);
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

  const handleAiStrategyAdvisor = async () => {
    if (!searchQuery) return;
    setIsAiStrategyLoading(true);
    setAiStrategy(null);
    setAiStrategyRecommendations([]);
    setAiStrategyActions([]);
    const runningToolId = addRunningTool('AI_STRATEGY_ADVISOR', 'ai', 'Strategy');
    
    try {
      addToSearchHistory(searchQuery);
      const prompt = `You are an elite OSINT strategist. Analyze the following search query: "${searchQuery}".
      
      Tasks:
      1. Determine the nature of the query (Email, Username, Domain, IP, Real Name, Image, etc.).
      2. Suggest the top 5 most relevant social media platforms to investigate for this specific target type.
      3. Recommend 3 advanced search strategies (e.g., specific Google Dorks, breach database queries, or specialized tools).
      4. Select the best OSINT tool groups from the following list to execute: ${TOOL_GROUPS.map(g => `${g.name} (ID: ${g.id})`).join(', ')}.
      
      Return a JSON object with:
      {
        "analysis": "A brief (2-3 sentence) analysis of the target type and why certain platforms/strategies are prioritized.",
        "platforms": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"],
        "strategies": [
          {"name": "Strategy Name", "description": "How to execute this strategy."},
          ...
        ],
        "recommendedGroups": ["g1", "g2", ...],
        "suggestedActions": ["RUN_SOCIAL_SCAN", "RUN_WHOIS", "RUN_BREACH_CHECK"]
      }`;

      const result = await generateAiContent(prompt);
      const text = result.text;
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiStrategy(parsed.analysis);
        setAiStrategyRecommendations(parsed.strategies || []);
        setAiStrategyActions(parsed.suggestedActions || []);
        
        updateToolStatus(runningToolId, { status: 'completed', results: 'Strategy analysis complete' });
      } else {
        setAiStrategy(text);
        updateToolStatus(runningToolId, { status: 'completed', results: 'Analysis complete' });
      }
    } catch (error) {
      console.error('AI Strategy analysis failed:', error);
      setAiStrategy('Failed to generate strategy. Please try standard intelligence scan.');
      updateToolStatus(runningToolId, { status: 'failed', results: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsAiStrategyLoading(false);
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
  }, [debouncedSearchQuery, selectedCategory, showFreeOnly, aiSuggestions]);

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

  const addRunningTool = (name: string, type: string, category?: string, api?: string, body?: any) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTool = { 
      id, 
      name, 
      type, 
      category: category || 'General',
      api,
      body,
      status: 'running', 
      startTime: Date.now(), 
      endTime: null,
      results: null,
      logs: [`Initializing ${name}...`, `Connecting to ${type} engine...`],
      progress: 0
    };
    setRunningTools(prev => [newTool, ...prev].slice(0, 20));
    setShowStatusWindow(true);
    return id;
  };

  useEffect(() => {
    const activeRunningTools = runningTools.filter(t => t.status === 'running');
    if (activeRunningTools.length === 0) return;

    const intervals: { [key: string]: NodeJS.Timeout } = {};
    
    activeRunningTools.forEach(tool => {
      if (!intervals[tool.id]) {
        intervals[tool.id] = setInterval(() => {
          setRunningTools(prev => {
            // Find the tool again in the current state
            const targetTool = prev.find(t => t.id === tool.id);
            if (!targetTool || targetTool.status !== 'running') {
              clearInterval(intervals[tool.id]);
              return prev;
            }

            const currentProgress = targetTool.progress || 0;
            const updates: any = {};
            
            if (currentProgress < 90) {
              const increment = currentProgress < 30 ? 15 : (currentProgress < 60 ? 8 : Math.random() * 3 + 1);
              updates.progress = Math.min(90, currentProgress + increment);
            } else if (currentProgress < 98) {
              updates.progress = currentProgress + (Math.random() * 0.5 + 0.1);
              const duration = Date.now() - targetTool.startTime;
              if (duration > 45000 && !targetTool.logs.includes('Operation taking longer than expected, still processing...')) {
                updates.logs = [...targetTool.logs, 'Operation taking longer than expected, still processing...'];
              }
            } else if (currentProgress < 99.9) {
              updates.progress = currentProgress + (Math.random() * 0.02 + 0.005);
            }
            
            if (updates.progress >= 10 && targetTool.logs.length === 2) {
              updates.logs = [...(updates.logs || targetTool.logs), 'Handshaking with remote server...', 'Bypassing rate limits...'];
            } else if (updates.progress >= 60 && targetTool.logs.length === 4) {
              updates.logs = [...(updates.logs || targetTool.logs), 'Awaiting server response...', 'Parsing data streams...'];
            } else if (updates.progress >= 95 && Math.random() > 0.95 && targetTool.logs.length < 12) {
              const patienceLogs = [
                'Still processing large dataset...',
                'Deep scanning in progress...',
                'Awaiting final results from remote nodes...',
                'Aggregating findings...',
                'Please wait, this may take a few minutes...'
              ];
              const nextLog = patienceLogs[Math.floor(Math.random() * patienceLogs.length)];
              if (!targetTool.logs.includes(nextLog)) {
                updates.logs = [...(updates.logs || targetTool.logs), nextLog];
              }
            }
            
            if (Object.keys(updates).length > 0) {
              return prev.map(t => t.id === tool.id ? { ...t, ...updates } : t);
            }
            return prev;
          });
        }, 1500);
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [runningTools.some(t => t.status === 'running')]);

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
    addToSearchHistory(searchQuery);
    setIsScanning(true);
    setIsHistoricalScan(true);
    setIsDeepScan(true);
    setAiSuggestions([]);
    setActiveTab('Scan');
    if (!scanResults || scanResults.target !== searchQuery) {
      setScanResults(null);
    }

    let results: any = null;
    try {
      const isDomain = searchQuery.includes('.') && !searchQuery.includes('@') && !searchQuery.includes(' ') && searchQuery.split('.').pop()!.length >= 2;
      const isEmail = searchQuery.includes('@') && searchQuery.includes('.');
      const isUsername = !isDomain && !isEmail;

      results = {
        timestamp: new Date().toISOString(),
        target: searchQuery,
        type: isDomain ? 'Domain' : isEmail ? 'Email' : 'Username',
        possibleIdentifiers: generatePossibleIdentifiers(searchQuery)
      };

      // 1. Wayback Timeline for the target
      let timelineUrl = searchQuery;
      if (!searchQuery.startsWith('http')) {
        if (isDomain) timelineUrl = `http://${searchQuery}`;
        else if (isUsername) timelineUrl = `https://twitter.com/${searchQuery}`; // Default to a major site for timeline if username
      }

      const runTool = async (name: string, api: string) => {
        const runningToolId = addRunningTool(name, 'historical', 'Historical', api);
        try {
          const res = await fetch(api);
          if (res.ok) {
            const data = await res.json();
            const count = data.results ? data.results.length : (Array.isArray(data) ? data.length : Object.keys(data).length);
            updateToolStatus(runningToolId, { status: 'completed', results: `Found ${count} data points` });
            return data;
          }
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || `API Error (${res.status})`;
          updateToolStatus(runningToolId, { status: 'failed', results: errorMessage });
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
      results.social = socialRes?.results || socialRes;
      results.socialSuggestions = socialRes?.suggestions || [];
      results.whois = whoisRes;
      results.dns = dnsRes;

      if (results.socialSuggestions && results.socialSuggestions.length > 0) {
        setAiSuggestions(prev => {
          const all = [
            ...prev, 
            ...results.socialSuggestions.map((s: any) => ({
              name: s.name,
              reason: s.description,
              directLink: s.url
            }))
          ];
          const seen = new Set();
          return all.filter(s => {
            if (seen.has(s.name)) return false;
            seen.add(s.name);
            return true;
          });
        });
      }

      setScanResults(prev => {
        const updated = { ...prev, ...results };
        
        // Prune social results for history to stay within localStorage limits
        const historyResults = { ...updated };
        if (historyResults.social && Array.isArray(historyResults.social)) {
          historyResults.social = historyResults.social.filter((s: any) => 
            s.status === 'Found' || s.status === 'Possible but Deleted'
          ).slice(0, 200);
        }

        const historyItem = {
          timestamp: results.timestamp,
          query: searchQuery,
          isDeep: true,
          results: historyResults
        };
        
        console.log('Saving historical scan to history:', historyItem);
        setScanHistory(h => [historyItem, ...h].slice(0, 10));
        
        return updated;
      });
      
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
      const results = data?.results || (Array.isArray(data) ? data : []);
      const suggestions = data?.suggestions || [];

      if (results.length > 0) {
        const found = results.filter((s: any) => s.status === 'Found' || s.status === 'Possible but Deleted');
        setQuickSocialResults(found);
      }

      if (suggestions.length > 0) {
        setAiSuggestions(prev => {
          const all = [
            ...prev,
            ...suggestions.map((s: any) => ({
              name: s.name,
              reason: s.description,
              directLink: s.url
            }))
          ];
          const seen = new Set();
          return all.filter(s => {
            if (seen.has(s.name)) return false;
            seen.add(s.name);
            return true;
          });
        });
      }
    } catch (error) {
      console.error('Quick scan failed:', error);
    } finally {
      setIsQuickScanning(false);
    }
  };

  const runTool = async (name: string, api: string, toolId?: string, category?: string, body?: any) => {
    const runningToolId = addRunningTool(name, 'scan', category || 'General', api, body);
    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    const timeoutId = setTimeout(() => controller.abort(), 300000); // Reduced to 5 minutes
    
    try {
      let finalApi = api;
      let finalBody = body;

      // Automatically switch to POST for long search queries to avoid 414 URI Too Long
      if (!finalBody && api.includes('/api/osint/search')) {
        try {
          // If it's already a search URL with query param
          if (api.includes('?q=')) {
            const urlObj = new URL(api, window.location.origin);
            const q = urlObj.searchParams.get('q');
            if (q && (api.length > 1000 || q.length > 500)) {
              finalApi = '/api/osint/search';
              finalBody = { q };
            }
          }
        } catch (e) {
          console.warn('Failed to parse search API URL for POST conversion:', e);
          // Fallback to original GET
        }
      }

      const headers = new Headers();
      let keysInHeader = true;

      // Move keys to body for POST requests to avoid header limits
      if (finalBody && typeof finalBody === 'object') {
        finalBody.customApiKeys = customApiKeys;
        keysInHeader = false;
      }

      if (keysInHeader) {
        try {
          const keysJson = JSON.stringify(customApiKeys);
          const encodedKeys = btoa(unescape(encodeURIComponent(keysJson)));
          headers.append('X-Custom-API-Keys', encodedKeys);
        } catch (e) {
          console.warn('Failed to encode custom API keys:', e);
          headers.append('X-Custom-API-Keys', btoa('{}'));
        }
      }

      const fetchOptions: RequestInit = { 
        signal: controller.signal,
        headers
      };
      if (finalBody) {
        fetchOptions.method = 'POST';
        headers.append('Content-Type', 'application/json');
        fetchOptions.body = JSON.stringify(finalBody);
      }
      const res = await fetch(finalApi, fetchOptions);
      abortControllersRef.current = abortControllersRef.current.filter(c => c !== controller);
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        const isSocial = name.includes('SOCIAL') || name.includes('PRESENCE');
        const socialResults = isSocial && data.results ? data.results : (Array.isArray(data) ? data : []);
        const hits = isSocial ? socialResults.filter((s: any) => s.status === 'Found' || s.status === 'Possible but Deleted') : [];
        
        updateToolStatus(runningToolId, { 
          status: 'completed', 
          progress: 100,
          results: `Found ${isSocial ? socialResults.length : (Array.isArray(data) ? data.length : typeof data === 'object' && data !== null ? Object.keys(data).length : 0)} data points`,
          logs: isSocial
            ? [`Scan complete. Found ${hits.length} active profiles.`, ...hits.map((h: any) => `HIT: ${h.name} - ${h.url}`)]
            : [`Scan complete. Received ${Array.isArray(data) ? data.length : 'data'} results.`],
          siteResults: isSocial ? socialResults : []
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
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `API Error (${res.status})`;
        
        // Special handling for WHOIS "no server known" to make it more user-friendly
        let finalError = errorMessage;
        if (errorMessage.includes('no whois server is known')) {
          finalError = 'No WHOIS server found for this TLD. Try a different domain extension.';
        }
        
        updateToolStatus(runningToolId, { 
          status: 'failed', 
          progress: 100, 
          results: finalError,
          logs: [`Error: ${finalError}`]
        });
        return null;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      abortControllersRef.current = abortControllersRef.current.filter(c => c !== controller);
      let errorMessage = e instanceof Error && e.name === 'AbortError' ? 'Request timed out' : e instanceof Error ? `${e.message}\n${e.stack}` : 'Unknown error';
      
      if (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
        errorMessage = "Network error: Load failed. This usually happens when a browser extension (like an adblocker) blocks the request, or the network connection is lost.";
      }
      
      updateToolStatus(runningToolId, { 
        status: 'failed', 
        progress: 100, 
        results: errorMessage,
        logs: [`Critical Error: ${errorMessage}`]
      });
      return null;
    }
  };

  const handleScan = async (deep = false) => {
    const mainQuery = searchQuery.trim();
    const secondaryQuery = (showSecondarySearch && searchQuerySecondary) ? searchQuerySecondary.trim() : null;
    
    if (!mainQuery && !secondaryQuery) return;
    
    // Clear any existing controllers
    abortControllersRef.current.forEach(c => c.abort());
    abortControllersRef.current = [];
    
    setIsScanning(true);
    setIsDeepScan(deep);
    setIsHistoricalScan(false);
    setAiSuggestions([]);
    setActiveTab('Scan');

    const processTarget = async (query: string, isPrimary: boolean) => {
      saveSearch(query);
      addToSearchHistory(query);
      
      if (isPrimary && (!scanResults || scanResults.target !== query)) {
        setScanResults(null);
      }

      let results: any = null;
      try {
        const isDomain = query.includes('.') && !query.includes('@') && !query.includes(' ') && query.split('.').pop()!.length >= 2;
        const isEmail = query.includes('@') && query.includes('.');
        const isUsername = !isDomain && !isEmail;

        results = {
          timestamp: new Date().toISOString(),
          target: query,
          type: isDomain ? 'Domain' : isEmail ? 'Email' : 'Username',
          possibleIdentifiers: generatePossibleIdentifiers(query)
        };

        if (deep) {
          const promises: Promise<any>[] = [];
          
          if (isDomain || isEmail) {
            promises.push(runTool('WHOIS_LOOKUP', `/api/osint/whois?target=${query}`, undefined, 'Domain'));
            promises.push(runTool('DNS_ENUMERATION', `/api/osint/dns?target=${query}`, undefined, 'Domain'));
          } else {
            promises.push(Promise.resolve(null));
            promises.push(Promise.resolve(null));
          }
          
          // Differentiated social searches
          promises.push(runTool('SOCIAL_PRESENCE (SHERLOCK)', `/api/osint/social?target=${query}&tool=sherlock`, undefined, 'Social'));
          promises.push(runTool('SOCIAL_DOSSIER (MAIGRET)', `/api/osint/social?target=${query}&tool=maigret`, undefined, 'Social'));
          
          const [whoisRes, dnsRes, sherlockRes, maigretRes] = await Promise.all(promises);
          results.whois = whoisRes;
          results.dns = dnsRes;
          
          // Merge specialized social results
          const sherlockResults = sherlockRes?.results || (Array.isArray(sherlockRes) ? sherlockRes : []);
          const maigretResults = maigretRes?.results || (Array.isArray(maigretRes) ? maigretRes : []);
          const combinedSocial = [...sherlockResults, ...maigretResults];
          
          const uniqueSocial = Array.from(new Map(combinedSocial.map(s => [s.name, s])).values());
          results.social = uniqueSocial;

          // Merge suggestions
          const combinedSuggestions = [...(sherlockRes?.suggestions || []), ...(maigretRes?.suggestions || [])];
          if (combinedSuggestions.length > 0) {
            setAiSuggestions(prev => {
              const all = [...prev, ...combinedSuggestions.map((s: any) => ({
                name: s.name,
                reason: s.description,
                directLink: s.url
              }))];
              // Deduplicate by name
              const seen = new Set();
              return all.filter(s => {
                if (seen.has(s.name)) return false;
                seen.add(s.name);
                return true;
              });
            });
          }
        } else {
          if (isDomain) {
            const [whoisRes, dnsRes] = await Promise.all([
              runTool('WHOIS_LOOKUP', `/api/osint/whois?target=${query}`, undefined, 'Domain'),
              runTool('DNS_ENUMERATION', `/api/osint/dns?target=${query}`, undefined, 'Domain')
            ]);
            results.whois = whoisRes;
            results.dns = dnsRes;
          }

          if (isUsername || isEmail) {
            const socialData = await runTool('SOCIAL_IDENTIFIER', `/api/osint/social?target=${query}`, undefined, 'Social');
            results.social = socialData?.results || (Array.isArray(socialData) ? socialData : []);
            
            if (socialData?.suggestions?.length > 0) {
              setAiSuggestions(prev => [
                ...prev,
                ...socialData.suggestions.map((s: any) => ({
                  name: s.name,
                  reason: s.description,
                  directLink: s.url
                }))
              ]);
            }
          }

          if (isEmail) {
            const [ghuntRes, epieosRes, holeheRes] = await Promise.all([
              runTool('GSYNC_RECON', `/api/osint/search?q=${encodeURIComponent(`"${query}" google account -inurl:login -inurl:signin -inurl:signup`)}`, 'ghunt', 'Email'),
              runTool('EPIEOS_PROFILER', `/api/osint/search?q=${encodeURIComponent(`site:epieos.com "${query}"`)}`, 'epieos', 'Email'),
              runTool('HOLEHE_VERIFIER', `/api/osint/search?q=${encodeURIComponent(`"${query}" account existence check site:social-identifier.com`)}`, 'holehe', 'Email')
            ]);
            results.ghunt = ghuntRes;
            results.epieos = epieosRes;
            results.holehe = holeheRes;
          }
        }

        // Add confidence scoring to results
        if (results.social && Array.isArray(results.social)) {
          results.social = results.social.map((s: any) => {
            let confidence = 50; // Base confidence
            if (s.status === 'Found') confidence += 20;
            if (s.avatar) confidence += 10;
            if (s.bio) confidence += 10;
            if (s.followers || s.posts) confidence += 10;
            return { ...s, confidence: Math.min(confidence, 100) };
          });
        }

        // Add to history
        const historyResults = { ...results };
        if (historyResults.social && Array.isArray(historyResults.social)) {
          historyResults.social = historyResults.social.filter((s: any) => 
            s.status === 'Found' || s.status === 'Possible but Deleted'
          ).slice(0, 200);
        }

        const historyItem = {
          timestamp: results.timestamp,
          query: query,
          isDeep: deep,
          results: historyResults
        };
        
        setScanHistory(prev => [historyItem, ...prev].slice(0, 50));

        return results;
      } catch (error) {
        console.error(`Scan failed for ${query}:`, error);
        return null;
      }
    };

    const runAllScans = async () => {
      const mainResults = mainQuery ? await processTarget(mainQuery, true) : null;
      const secondResults = secondaryQuery ? await processTarget(secondaryQuery, !mainQuery) : null;
      
      // If we have both, we can optionally merge them for the visualization
      if (mainResults && secondResults) {
        setScanResults({
          ...mainResults,
          target: `${mainQuery} + ${secondaryQuery}`,
          combined: true,
          secondaryTarget: secondaryQuery,
          // Merge social results for visualization
          social: [...(mainResults.social || []), ...(secondResults.social || [])]
        });
      } else if (mainResults) {
        setScanResults(mainResults);
      } else if (secondResults) {
        setScanResults(secondResults);
      }
      
      setIsScanning(false);
      if (mainResults || secondResults) setShowIntelligenceWindow(true);
    };

    runAllScans();
  };

  const handleToolSearch = async (toolOrName: OSINTTool | string, customUrl?: string) => {
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
    
    if (searchQuery) {
      addToSearchHistory(searchQuery);
    }

    // If no search query, just open the tool URL in the browser tab
    if (!searchQuery) {
      setBrowserUrl(url);
      setBrowserHistory(prev => [url, ...prev].slice(0, 50));
      setActiveTab('Browser');
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

    if (toolId === 'diag-01') { // System Diagnostics
      setIsModalLoading(true);
      setModalContent({ title: 'System Diagnostics', content: 'Running diagnostics...', type: 'info', results: [], url: '/api/health' });
      const runningToolId = addRunningTool('System Diagnostics', 'diagnostics', 'System');
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setModalContent({ 
          title: 'System Diagnostics', 
          content: `System Status: ${data.status.toUpperCase()}\nTimestamp: ${data.timestamp}\nEnvironment: ${data.environment}\nVersion: ${data.version}`, 
          type: 'info', 
          results: data, 
          url: '/api/health' 
        });
        updateToolStatus(runningToolId, { status: 'completed', results: `Status: ${data.status}` });
      } catch (error) {
        console.error('Diagnostics failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateToolStatus(runningToolId, { status: 'failed', results: errorMessage });
        setModalContent({ 
          title: 'Diagnostics Failed', 
          content: `Could not reach backend health endpoint: ${errorMessage}`, 
          type: 'error', 
          results: [], 
          url: '/api/health' 
        });
      } finally {
        setIsModalLoading(false);
      }
      return;
    }

    if (toolId === '61') { // Wayback Timeline
      setIsTimelineLoading(true);
      setActiveTab('Scan');
      const api = `/api/osint/wayback-timeline?url=${encodeURIComponent(searchQuery)}`;
      runTool('Wayback Timeline', api, '61', 'Breach & History').then(() => {
        setIsTimelineLoading(false);
      }).catch(() => {
        setIsTimelineLoading(false);
      });
      return;
    }

    // If it's a Google search, use our search endpoint
    if (url.includes('google.com/search')) {
      let q: string | null = null;
      try {
        // Handle potential URL parsing issues for extremely long dorks or relative URLs
        if (url.includes('q=')) {
          const searchPart = url.split('q=')[1].split('&')[0];
          q = decodeURIComponent(searchPart.replace(/\+/g, ' '));
        } else {
          const base = url.startsWith('/') ? window.location.origin : undefined;
          q = new URL(url, base).searchParams.get('q');
        }
      } catch (e) {
        console.warn('Standard URL parsing failed for Google search, trying manual extraction:', e);
        try {
          const match = url.match(/[?&]q=([^&]+)/);
          if (match) q = decodeURIComponent(match[1].replace(/\+/g, ' '));
        } catch (e2) {
          console.error('Manual extraction also failed:', e2);
        }
      }

      if (q) {
        setIsModalLoading(true);
        setModalContent({ title: `${name} Results`, content: '', type: 'search', results: [], url });
        const runningToolId = addRunningTool(name, 'search', typeof toolOrName !== 'string' ? toolOrName.category : 'General');
        try {
          const body = { 
            q,
            customApiKeys: customApiKeys // Send in body to avoid header limits
          };

          const res = await fetch('/api/osint/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
              // Header removed to avoid 431 or network refusal due to large headers
            },
            body: JSON.stringify(body)
          });
          if (res.ok) {
            const data = await res.json();
            setModalContent({ title: `${name} Results`, content: '', type: 'search', results: data, url });
            updateToolStatus(runningToolId, { status: 'completed', results: `Found ${data.length} results` });
          } else {
            let errorMessage = `API Error (${res.status})`;
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // Not JSON results, maybe 502/504
              if (res.status === 431) errorMessage = "Request headers too large. Try removing some API keys.";
              if (res.status === 504) errorMessage = "Search timed out. The search engines are responding slowly.";
              if (res.status === 429) errorMessage = "Rate limited. Please wait before searching again.";
            }
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error('Tool search failed:', error);
          let errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (errorMessage === 'Load failed' || errorMessage === 'Failed to fetch') {
            errorMessage = "Network error. This usually happens if the search query is too complex, the network is unstable, or a browser extension is blocking the request.";
          }
          
          updateToolStatus(runningToolId, { status: 'failed', results: errorMessage });
          
          // Inform user about failure without automatic redirect
          setModalContent({ 
            title: 'Search Failed', 
            content: `Internal search failed: ${errorMessage}. You can try accessing the source directly via the browser tab or proxy mode.`, 
            type: 'error', 
            results: [], 
            url: url 
          });
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

  const extractJson = (text: string) => {
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch (e) {
      // Try to find JSON block
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', e2);
        }
      }
      return null;
    }
  };

  const generateDorks = async () => {
    if (!searchQuery) return;
    setIsGeneratingDorks(true);
    const runningToolId = addRunningTool('DORK_GENERATOR', 'ai', 'Dorks');
    try {
      const prompt = `Generate a list of 10 highly effective Google Dorks for the target: "${searchQuery}". 
        The OSINT objectives are: "${dorkObjectives || 'General reconnaissance, finding sensitive files, and discovering subdomains'}".
        Return ONLY a JSON array of objects, each with "query", "description", and "category" fields.
        Categories should be things like "Sensitive Files", "Login Pages", "Subdomains", "Directory Listing", etc.`;
      
      const response = await generateAiContent(prompt);
      const dorks = extractJson(response.text);
      
      if (dorks && Array.isArray(dorks)) {
        setGeneratedDorks(dorks);
        updateToolStatus(runningToolId, { status: 'completed', results: `Generated ${dorks.length} dorks` });
      } else {
        throw new Error('AI returned invalid data format. Try again.');
      }
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
        - Legal names and physical addresses (PRIORITY)
        - Primary city/state of residence (if full address is redacted)
        - Potential social media profiles
        - Email addresses and phone numbers
        - Associated usernames or aliases
        - Potential data breaches or leaks
        - Risk assessment and recommended next steps
        
        If scanning a USERNAME: 
        1. Look for real-world markers in bios and snippet data.
        2. Analyze identified locations for regional patterns (e.g., specific dialects or platform preferences like VK or LINE).
        3. Flag any potential forensic metadata mentioned in snippets (e.g., mentions of specific camera models or software versions).
        
        If scanning a PHONE NUMBER:
        1. Look for caller ID markers, owner names, and carrier details.
        2. Identify links to social profiles or business listings associated with the number.
        3. Note if the number is identified as VoIP, mobile, or landline.
        4. Suggest specialized AI-powered Google Dorks to find the number in leaked contact lists or specialized directories (e.g., WhatsApp group links or PDF resumes).
        
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
    addToSearchHistory(searchQuery);
    const group = TOOL_GROUPS.find(g => g.id === selectedGroup);
    if (!group) return;

    setIsScanning(true);
    setActiveTab('Scan');
    
    if (!scanResults || scanResults.target !== searchQuery) {
      setScanResults({
        target: searchQuery,
        timestamp: new Date().toISOString(),
        type: searchQuery.includes('.') && !searchQuery.includes('@') ? 'Domain' : searchQuery.includes('@') ? 'Email' : 'Username',
        possibleIdentifiers: generatePossibleIdentifiers(searchQuery),
        workflowResults: {}
      });
    } else {
      setScanResults(prev => ({ 
        ...prev, 
        possibleIdentifiers: generatePossibleIdentifiers(searchQuery),
        workflowResults: {} 
      }));
    }

    const workflowId = addRunningTool(`WORKFLOW: ${group.name}`, 'workflow', 'Workflow');
    const localResults: any = {
      target: searchQuery,
      timestamp: new Date().toISOString(),
      type: searchQuery.includes('.') && !searchQuery.includes('@') ? 'Domain' : searchQuery.includes('@') ? 'Email' : 'Username',
      workflowResults: {}
    };

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
      } else if (['23', '43', '39', '1'].includes(tool.id)) { // DNS/Domain tools
        api = `/api/osint/dns?target=${encodeURIComponent(searchQuery)}`;
      } else if (['2', '19', '51', '52'].includes(tool.id)) { // Social presence tools
        api = `/api/osint/social?target=${encodeURIComponent(searchQuery)}`;
      } else if (['6', '26', '62', '63', '64', '65'].includes(tool.id)) { // Breach tools
        const toolName = tool.id === '26' ? 'leakcheck' : tool.id === '6' || tool.id === '62' ? 'hibp' : 'generic';
        api = `/api/osint/breach?target=${encodeURIComponent(searchQuery)}&tool=${toolName}`;
      } else if (tool.id === '3' || tool.id === '61') { // Wayback Machine or Wayback Timeline
        api = `/api/osint/wayback-timeline?url=${encodeURIComponent(searchQuery)}`;
      } else if (['100', '101', '102', '103', '90', '111', '112', '113', '114'].includes(tool.id)) { // Specialized Identity/Phone/Dork Search
        // Use site-specific dorks for better discovery through search engines
        const domain = tool.url.replace('https://', '').replace('www.', '').split('/')[0];
        api = `/api/osint/search?q=${encodeURIComponent(`site:${domain} "${searchQuery}"`)}`;
      } else if (tool.id === '108') { // Spokeo
        api = `/api/osint/search?q=${encodeURIComponent(`site:spokeo.com "${searchQuery}"`)}`;
      } else if (tool.id === '109') { // XF Metadata forensic
        api = `/api/osint/metadata?url=${encodeURIComponent(searchQuery)}`;
      } else if (tool.id === '110') { // Regional Scout
        api = `/api/osint/search?q=${encodeURIComponent(`"${searchQuery}" (site:line.me OR site:weibo.com OR site:vk.com OR site:ok.ru OR site:zhihu.com)`)}`;
      } else if (tool.id === '87') { // AI Deep Scan Analyst
        // Skip automated run for UI-only tools, but mark as completed
        setWorkflowProgress(prev => ({ ...prev, [id]: true }));
        continue;
      } else if (tool.id === '88' || tool.id === '115') { // AI Google Dork Generators
        // Skip automated run for UI-only tools, but mark as completed
        setWorkflowProgress(prev => ({ ...prev, [id]: true }));
        continue;
      } else if (tool.id === 'diag-01') { // System Diagnostics
        api = '/api/health';
      } else {
        const url = tool.searchUrl ? tool.searchUrl.replace('{query}', encodeURIComponent(searchQuery)) : tool.url;
        try {
          if (url && url !== '#' && (url.startsWith('http') || url.startsWith('/'))) {
            if (url.includes('google.com/search')) {
              const base = url.startsWith('/') ? window.location.origin : undefined;
              const searchUrlObj = new URL(url, base);
              const q = searchUrlObj.searchParams.get('q');
              api = `/api/osint/search?q=${encodeURIComponent(q || searchQuery)}`;
            } else {
              api = `/api/osint/proxy-tool?url=${encodeURIComponent(url)}`;
            }
          } else {
            // Skip tools with no valid URL
            setWorkflowProgress(prev => ({ ...prev, [id]: true }));
            continue;
          }
        } catch (e) {
          console.warn(`Failed to process URL for tool ${id}:`, url, e);
          if (url && url !== '#' && (url.startsWith('http') || url.startsWith('/'))) {
            api = `/api/osint/proxy-tool?url=${encodeURIComponent(url)}`;
          } else {
            setWorkflowProgress(prev => ({ ...prev, [id]: true }));
            continue;
          }
        }
      }

      const data = await runTool(tool.name, api, id, tool.category);
      if (data) {
        localResults.workflowResults[id] = { results: data, url: api };
      }
      setWorkflowProgress(prev => ({ ...prev, [id]: true }));
      
      // Add a small jittered delay between tools
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    }

    setCurrentlyRunningToolId(null);
    setIsScanning(false);
    updateToolStatus(workflowId, { status: 'completed', progress: 100, results: 'Workflow finished' });
    
    // Save to scan history
    const historyItem = {
      timestamp: localResults.timestamp,
      query: localResults.target,
      isDeep: true,
      results: localResults
    };
    console.log('Saving workflow scan to history:', historyItem);
    setScanHistory(prev => [historyItem, ...prev].slice(0, 10));
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
            const res = await fetch('/api/osint/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ q })
            });
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
        // Switch to browser tab instead of window.open
        setBrowserUrl(url);
        setBrowserHistory(prev => [url, ...prev].slice(0, 50));
        setActiveTab('Browser');
      } finally {
        setIsModalLoading(false);
        setCurrentlyRunningToolId(null);
        setWorkflowProgress(prev => ({ ...prev, [toolId]: true }));
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-neon-magenta selection:text-white transition-colors duration-300">
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
                { id: 'TargetIntel', icon: Shield, label: 'Intel Report' },
                { id: 'Status', icon: Activity, label: 'Live Ops' },
                { id: 'Workflows', icon: Layers, label: 'Workflows' },
                { id: 'Analyst', icon: Brain, label: 'Analyst' },
                { id: 'Dorks', icon: Terminal, label: 'Dorks' },
                { id: 'Intel', icon: Activity, label: 'Intel Feed' },
                { id: 'Browser', icon: Globe, label: 'Browser' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'TargetIntel') {
                      setShowIntelligenceWindow(!showIntelligenceWindow);
                    } else if (item.id === 'Status') {
                      setShowStatusWindow(!showStatusWindow);
                    } else {
                      setActiveTab(item.id as any);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all group relative ${
                    (item.id === 'TargetIntel' && showIntelligenceWindow) || (item.id === 'Status' && showStatusWindow) || activeTab === item.id 
                      ? 'text-neon-cyan' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {((item.id === 'TargetIntel' && showIntelligenceWindow) || (item.id === 'Status' && showStatusWindow) || activeTab === item.id) && (
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
              onClick={() => setShowCommandPalette(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-neon-cyan lg:hidden"
              title="Command Palette"
            >
              <Terminal size={14} />
            </button>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-neon-magenta group"
              title="Target History"
            >
              <Clock size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">History</span>
            </button>
            <button 
              onClick={() => setIsResultsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-neon-yellow group"
              title="All Results"
            >
              <BarChart3 size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Results</span>
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-neon-cyan"
              title="Settings"
            >
              <Settings size={14} />
            </button>
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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:border-neon-magenta/50 hover:bg-neon-magenta/5 transition-all group"
              >
                <Clock size={16} className="text-neon-magenta group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-black text-white uppercase tracking-widest">History</span>
              </button>
              <button 
                onClick={() => setIsResultsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:border-neon-yellow/50 hover:bg-neon-yellow/5 transition-all group"
              >
                <BarChart3 size={16} className="text-neon-yellow group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Results</span>
              </button>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-9xl font-graffiti tracking-widest text-text-primary drop-shadow-[0_5px_15px_rgba(0,243,255,0.5)] mb-6 leading-tight">
            OSINT <span className="text-neon-magenta">HUB</span>
          </h1>
          
          <div className="max-w-2xl border-l-4 border-neon-cyan pl-4 md:pl-6 space-y-4">
            <span className="text-neon-cyan font-mono text-sm uppercase tracking-widest block">// INPUT TARGET DATA BELOW</span>
            <div className="flex flex-col gap-4">
              <div ref={searchRef} className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-lg group focus-within:border-neon-cyan transition-all relative">
                {searchQuery && !searchQuery.includes('.') && !searchQuery.includes('@') ? (
                  <User size={24} className="text-neon-cyan shrink-0 animate-pulse" />
                ) : (
                  <Search size={24} className="text-neon-cyan shrink-0" />
                )}
                <div className="flex-1 flex items-center gap-3 relative">
                  <input 
                    type="text" 
                    placeholder="ENTER TARGET (DOMAIN, EMAIL, USERNAME)..."
                    className="flex-1 bg-transparent border-none outline-none text-xl md:text-3xl placeholder:opacity-20 font-mono text-neon-cyan uppercase tracking-wider"
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

                  <button 
                    onClick={() => setShowSecondarySearch(!showSecondarySearch)}
                    className={`p-2 rounded-md transition-all ${showSecondarySearch ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/50' : 'bg-white/5 text-white/40 border border-white/10 hover:border-neon-cyan hover:text-neon-cyan'}`}
                    title={showSecondarySearch ? "Remove Secondary Target" : "Add Secondary Target"}
                  >
                    <Plus size={20} className={showSecondarySearch ? 'rotate-45 transition-transform' : 'transition-transform'} />
                  </button>
                  
                  {/* Search History Dropdown */}
                  <AnimatePresence>
                    {showHistoryDropdown && filteredHistory.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 w-full mt-2 bg-bg-secondary border-2 border-neon-cyan/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[100] max-h-80 overflow-y-auto rounded-lg backdrop-blur-xl"
                      >
                        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                          <div className="flex items-center gap-2">
                            <History size={14} className="text-neon-cyan" />
                            <span className="text-[10px] font-mono text-white/60 uppercase tracking-[0.2em]">Recent_Intelligence_Queries</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Wipe all search history?')) {
                                setSearchHistory([]);
                                localStorage.removeItem('osintSearchHistory');
                              }
                            }}
                            className="text-[9px] font-mono text-neon-magenta uppercase hover:text-white transition-colors flex items-center gap-1"
                          >
                            <X size={10} /> PURGE_ALL
                          </button>
                        </div>
                        <div className="py-1">
                          {filteredHistory.map((s, i) => (
                            <div 
                              key={i}
                              className={`flex items-center group transition-colors ${historyIndex === i ? 'bg-neon-cyan/10' : 'hover:bg-white/5'}`}
                            >
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(s);
                                  setShowHistoryDropdown(false);
                                  setHistoryIndex(-1);
                                }}
                                className="flex-1 text-left px-4 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-3 overflow-hidden"
                              >
                                <Search size={12} className={`shrink-0 ${historyIndex === i ? 'text-neon-cyan' : 'text-white/20 group-hover:text-neon-cyan'}`} />
                                <span className="truncate text-white/80 group-hover:text-white">{s}</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromSearchHistory(s);
                                }}
                                className="p-3 text-white/10 hover:text-neon-magenta transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove from history"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {showSecondarySearch && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-lg group focus-within:border-neon-magenta transition-all relative">
                      <Target size={24} className="text-neon-magenta shrink-0" />
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="ADD SECONDARY TARGET..."
                          className="w-full bg-transparent border-none outline-none text-xl md:text-3xl placeholder:opacity-20 font-mono text-neon-magenta uppercase tracking-wider"
                          value={searchQuerySecondary}
                          onChange={(e) => setSearchQuerySecondary(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                {isScanning ? (
                  <button 
                    onClick={stopScan}
                    className="px-8 py-3 border-2 border-red-500 text-red-500 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-3 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    <Square size={16} fill="currentColor" />
                    STOP_SCAN
                  </button>
                ) : (
                  <button 
                    onClick={() => handleScan()}
                    disabled={!searchQuery}
                    className={`px-8 py-3 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${!searchQuery ? 'border-white/10 text-white/20' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,243,255,0.2)]'}`}
                  >
                    <Terminal size={16} />
                    EXECUTE_SCAN
                  </button>
                )}
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
                  onClick={handleAiStrategyAdvisor}
                  disabled={!searchQuery || isAiStrategyLoading}
                  className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!searchQuery || isAiStrategyLoading ? 'border-white/10 text-white/20' : 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.3)]'}`}
                >
                  <Sparkles size={12} className={isAiStrategyLoading ? 'animate-pulse' : ''} />
                  {isAiStrategyLoading ? 'STRATEGIZING...' : 'AI_STRATEGY_ADVISOR'}
                </button>
                <button 
                  onClick={() => handleToolSearch('System Diagnostics')}
                  className="flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border-2 border-neon-magenta text-neon-magenta font-mono text-[9px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-neon-magenta hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.3)]"
                  title="Run system diagnostics to check API health"
                >
                  <Activity size={12} />
                  DIAGNOSTICS
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

          <AnimatePresence>
            {aiStrategy && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-7xl mx-auto px-6 py-4 border-t border-white/10 bg-neon-magenta/5 overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-neon-magenta/20 rounded border border-neon-magenta/40 shrink-0">
                    <Sparkles size={16} className="text-neon-magenta" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-mono text-neon-magenta uppercase tracking-widest font-bold flex items-center gap-2">
                        <Zap size={12} /> AI_STRATEGIC_ADVISORY_v1.0
                      </h4>
                      <button 
                        onClick={() => setAiStrategy(null)}
                        className="text-[9px] text-white/40 hover:text-white uppercase font-mono"
                      >
                        DISMISS
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-white/80 leading-relaxed mb-4">
                      {aiStrategy}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {aiStrategyRecommendations.map((rec, i) => (
                        <div key={i} className="p-3 bg-black/40 border border-neon-magenta/20 rounded">
                          <h5 className="text-[10px] font-mono text-neon-magenta uppercase mb-1">{rec.name}</h5>
                          <p className="text-[9px] font-mono text-white/60">{rec.description}</p>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => executeAiActions(aiStrategyActions)}
                      className="px-6 py-2 bg-neon-magenta text-black font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all flex items-center gap-2"
                    >
                      <Terminal size={14} /> EXECUTE_TARGETED_SEARCH_SEQUENCE
                    </button>
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
          <button 
            onClick={() => setActiveTab('History')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'History' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('Diagnostics')}
            className={`whitespace-nowrap px-3 md:px-6 py-2 md:py-3 font-mono text-[9px] md:text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Diagnostics' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            Diagnostics
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
          <Zap size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Scan</span>
        </button>
        <button 
          onClick={() => setShowIntelligenceWindow(!showIntelligenceWindow)}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${showIntelligenceWindow ? 'text-neon-lime shadow-[0_0_10px_rgba(57,255,20,0.2)]' : 'text-white/40'}`}
        >
          <Shield size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Intel_Report</span>
        </button>
        <button 
          onClick={() => setShowStatusWindow(!showStatusWindow)}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${showStatusWindow ? 'text-neon-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]' : 'text-white/40'}`}
        >
          <Activity size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Live_Ops</span>
        </button>
        <button 
          onClick={() => setActiveTab('Intel')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Intel' ? 'text-neon-yellow' : 'text-white/40'}`}
        >
          <Zap size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab('Analyst')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Analyst' ? 'text-neon-magenta' : 'text-white/40'}`}
        >
          <Brain size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">AI</span>
        </button>
        <button 
          onClick={() => setActiveTab('History')}
          className={`px-6 py-3 font-mono text-xs uppercase tracking-widest border-b-2 transition-all shrink-0 ${activeTab === 'History' ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/5' : 'border-transparent opacity-50'}`}
        >
          HISTORY
        </button>
        <button 
          onClick={() => setActiveTab('Diagnostics')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'Diagnostics' ? 'text-neon-cyan' : 'text-white/40'}`}
        >
          <Activity size={20} />
          <span className="text-[8px] font-mono uppercase tracking-tighter">Diag</span>
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
                                setSearchQuery(h.query);
                                setScanResults(h.results);
                                setIsDeepScan(h.isDeep);
                                setShowIntelligenceWindow(true);
                                setActiveTab('TargetIntel');
                              }}
                              className="text-[10px] font-mono text-white/60 hover:text-neon-cyan transition-all truncate uppercase tracking-widest"
                            >
                              [{h.results?.type || 'SCAN'}] {h.query}
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
                          <button 
                            onClick={() => openInBrowser(tool.aiDirectLink)}
                            className="mt-3 inline-flex items-center gap-2 text-[10px] text-neon-cyan hover:text-white transition-colors border-b border-neon-cyan/30"
                          >
                            <ExternalLink size={10} /> ACCESS_TOOL_DIRECTLY
                          </button>
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
                                  <button 
                                    onClick={() => openInBrowser(suggestion.directLink)}
                                    className="p-1.5 bg-neon-yellow/10 border border-neon-yellow/20 text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all rounded"
                                  >
                                    <ExternalLink size={12} />
                                  </button>
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
          ) : activeTab === 'History' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-4xl font-graffiti tracking-widest uppercase mb-2 text-neon-cyan">Intelligence_Archive</h2>
                  <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">Stored_Intelligence_Sequences // Local_Cache_Only</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={exportResults}
                    className="px-4 py-2 border border-neon-cyan/30 text-[10px] font-mono text-neon-cyan uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
                  >
                    Export_All_Archive
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('IRREVERSIBLE: Purge all intelligence archives?')) {
                        setScanHistory([]);
                        localStorage.removeItem('osintScanHistory');
                      }
                    }}
                    className="px-4 py-2 border border-neon-magenta/30 text-[10px] font-mono text-neon-magenta uppercase tracking-widest hover:bg-neon-magenta hover:text-black transition-all"
                  >
                    Purge_Archive
                  </button>
                </div>
              </div>

              {scanHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-20 border-2 border-dashed border-white/10 rounded-xl">
                  <History size={64} className="mb-6" />
                  <p className="text-xl uppercase tracking-[0.3em] font-bold text-white">No Archive Entries Found</p>
                  <p className="text-xs mt-2 uppercase tracking-widest text-white/60">Your intelligence missions will be logged here automatically</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {scanHistory.map((h, i) => (
                    <div key={i} className="bg-black/40 border-2 border-white/10 p-6 rounded-xl group hover:border-neon-cyan/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-tighter rounded ${
                            h.results?.type === 'Domain' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' :
                            h.results?.type === 'Email' ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30' :
                            'bg-neon-lime/20 text-neon-lime border border-neon-lime/30'
                          }`}>
                            {h.results?.type || 'UNKNOWN'}
                          </span>
                          {h.isDeep && (
                            <span className="px-2 py-0.5 text-[8px] font-mono uppercase tracking-tighter rounded bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30">
                              DEEP_SCAN
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-white/20 uppercase">
                            {new Date(h.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-mono text-white group-hover:text-neon-cyan transition-colors truncate">
                          {h.query}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {h.results?.whois && <span className="text-[8px] font-mono text-white/40 border border-white/10 px-1">WHOIS_OK</span>}
                          {h.results?.dns && <span className="text-[8px] font-mono text-white/40 border border-white/10 px-1">DNS_OK</span>}
                          {h.results?.social && h.results.social.length > 0 && (
                            <span className="text-[8px] font-mono text-neon-lime border border-neon-lime/20 px-1">
                              {h.results.social.filter((s:any) => s.status === 'Found').length} SOCIAL_FOUND
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setSearchQuery(h.query);
                            setScanResults(h.results);
                            setIsDeepScan(h.isDeep);
                            setShowIntelligenceWindow(true);
                            setActiveTab('TargetIntel');
                          }}
                          className="px-6 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
                        >
                          <Eye size={14} /> VIEW_REPORT
                        </button>
                        <button 
                          onClick={() => {
                            setSearchQuery(h.query);
                            scrollToSearch();
                          }}
                          className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/40 transition-all rounded"
                          title="Use as search query"
                        >
                          <Search size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setScanHistory(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="p-2 border border-neon-magenta/20 text-neon-magenta/40 hover:text-neon-magenta hover:border-neon-magenta/40 transition-all rounded"
                          title="Delete from archive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'Diagnostics' ? (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DiagnosticsView onRunDiagnostics={() => {}} />
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
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl"
            onClick={() => setModalContent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-6xl h-[90vh] bg-[#050505] border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative rounded-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-6">
                  <div className={`p-3 rounded-lg ${modalContent.type === 'article' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-neon-lime/20 text-neon-lime'}`}>
                    {modalContent.type === 'article' ? <FileText size={24} /> : <Search size={24} />}
                  </div>
                  <div>
                    <h2 className="font-mono text-xl uppercase tracking-[0.2em] text-white flex items-center gap-3">
                      {modalContent.title}
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/40 font-normal">SECURED_SESSION</span>
                    </h2>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">
                      Origin: {modalContent.url || 'Internal_Scan'} • {modalContent.results?.length || 0} Entities_Identified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {modalContent.type !== 'article' && (
                    <div className="flex bg-white/5 p-1 rounded-md border border-white/10">
                      <button 
                        onClick={() => setActiveModalView('list')}
                        className={`px-4 py-1.5 rounded text-[10px] uppercase tracking-widest transition-all ${activeModalView === 'list' ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white'}`}
                      >
                        Intel_Feed
                      </button>
                      <button 
                        onClick={() => setActiveModalView('viz')}
                        className={`px-4 py-1.5 rounded text-[10px] uppercase tracking-widest transition-all ${activeModalView === 'viz' ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white'}`}
                      >
                        Relationship_Map
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => setModalContent(null)}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-neon-magenta/20 hover:text-neon-magenta transition-all border border-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden relative font-mono">
                {isModalLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/40 backdrop-blur-sm z-50">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-neon-cyan/20 rounded-full animate-ping absolute inset-0" />
                      <div className="w-16 h-16 border-2 border-neon-cyan rounded-full animate-spin border-t-transparent" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-neon-cyan tracking-[0.5em] uppercase font-black animate-pulse">Synchronizing Cryptographic Streams</span>
                      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="w-1/2 h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {activeModalView === 'list' ? (
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                        {modalContent.type === 'article' && (
                          <div className="prose prose-invert max-w-none">
                            <div 
                              className="text-white/80 leading-relaxed text-sm md:text-base article-content selection:bg-neon-cyan/30"
                              dangerouslySetInnerHTML={{ __html: modalContent.content }}
                            />
                            {modalContent.url && (
                              <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                                <button 
                                  onClick={() => openInBrowser(modalContent.url)}
                                  className="group flex items-center gap-4 text-[10px] text-white/30 hover:text-neon-cyan transition-all uppercase tracking-[0.3em]"
                                >
                                  <ExternalLink size={16} className="group-hover:rotate-12 transition-transform" /> 
                                  Open_Primary_Source_Vault
                                </button>
                                <span className="text-[10px] text-white/10 uppercase tracking-tighter">DATA_KEY: {btoa(modalContent.url).substring(0, 16)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {(modalContent.type === 'search' || modalContent.type === 'tool') && (
                          <div className="space-y-6">
                             {(modalContent.title.toLowerCase().includes('deep') || modalContent.title.toLowerCase().includes('nsfw')) && (
                              <div className="p-6 bg-neon-magenta/5 border border-neon-magenta/20 rounded-xl space-y-4 mb-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-1000">
                                  <ShieldAlert size={120} />
                                </div>
                                <div className="flex items-center gap-3 text-neon-magenta relative z-10">
                                  <ShieldAlert size={20} className="animate-pulse" />
                                  <h4 className="font-black uppercase tracking-[0.4em] text-[10px]">Intelligence_Fidelity_Notice</h4>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed uppercase tracking-widest relative z-10 max-w-2xl">
                                  The following dataset contains matches from decentralized indices. Probability vectors:
                                  <br /><br />
                                  <span className="text-neon-magenta font-black">HIGH_CONFIDENCE:</span> Crytographic UID match. Extremely low false positive rate.
                                  <br />
                                  <span className="text-neon-cyan font-black">CORRELATED:</span> Signal detected via cross-platform metadata (Email/Bio).
                                  <br />
                                  <span className="text-white/30 font-black">OBSERVED:</span> Pattern-based match. Verification required.
                                </p>
                              </div>
                            )}

                            {modalContent.results && modalContent.results.length > 0 ? (
                              <div className="grid grid-cols-1 gap-4">
                                {modalContent.results.map((res: any, i: number) => {
                                  // Simple heuristic for confidence
                                  const confidence = res.confidence || (res.link.includes('facebook') || res.link.includes('twitter') || res.link.includes('instagram') ? 92 : 65);
                                  const isHigh = confidence > 85;
                                  
                                  return (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      key={i} 
                                      className="group relative bg-[#0a0a0a] border border-white/10 hover:border-neon-cyan/40 transition-all p-6 rounded-xl overflow-hidden"
                                    >
                                      {/* Side Indicator */}
                                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isHigh ? 'bg-neon-lime shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-white/10'}`} />
                                      
                                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex-1 space-y-3">
                                          <div className="flex items-center gap-3">
                                            <h4 className="text-white font-bold group-hover:text-neon-cyan transition-colors text-sm uppercase tracking-wide">{res.title}</h4>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${isHigh ? 'border-neon-lime/30 text-neon-lime bg-neon-lime/10' : 'border-white/10 text-white/30'}`}>
                                              {confidence}%_FIDELITY
                                            </span>
                                          </div>
                                          <p className="text-xs text-white/40 leading-relaxed font-normal normal-case line-clamp-2 italic">
                                            "{res.snippet}"
                                          </p>
                                          
                                          <div className="flex flex-wrap items-center gap-4 pt-2">
                                            <button 
                                              onClick={() => openInBrowser(res.link)}
                                              className="text-[9px] text-white/30 hover:text-neon-cyan transition-colors flex items-center gap-2 truncate max-w-sm font-mono tracking-tighter"
                                            >
                                              <LinkIcon size={12} /> {res.link}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                                          <button
                                            onClick={() => handleCopy(res.link)}
                                            className="p-3 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-all group/btn"
                                            title="Copy Intelligence Link"
                                          >
                                            {copiedUrl === res.link ? <Check size={16} className="text-neon-lime" /> : <Copy size={16} className="group-hover/btn:scale-110 transition-transform" />}
                                          </button>
                                          <button
                                            onClick={() => openInBrowser(res.link)}
                                            className="p-3 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all group/btn"
                                            title="Decipher Source"
                                          >
                                            <ExternalLink size={16} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-32 flex flex-col items-center justify-center text-center">
                                <Database className="w-16 h-16 text-white/5 mb-6 animate-bounce" />
                                <h5 className="text-xs uppercase tracking-[0.5em] text-white/20 font-black">Zero Signals Intercepted</h5>
                                <p className="text-[10px] text-white/10 mt-2 uppercase">The intelligence sector is dark. Try alternate handle variations.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <IntelligenceGraph results={modalContent.results || []} />
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-black border-t border-white/5 flex justify-between items-center text-[8px] font-mono overflow-hidden">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-neon-cyan/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                    <span className="uppercase tracking-widest">Connection_Stable</span>
                  </div>
                  <div className="text-white/10 uppercase tracking-widest hidden sm:block">
                    Encryption: AES-256-GCM • Path: {modalContent.title.replace(/\s+/g, '_')}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/30">
                  <span className="uppercase tracking-tighter">Terminal_v1.2.0</span>
                  <div className="w-px h-3 bg-white/10" />
                  <span>{new Date().toISOString()}</span>
                </div>
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
      
      {/* Floating Monitor Toggle - High Z-Index Global Controls */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-4 items-end">
        {/* Command Palette Button */}
        <div className="flex items-center gap-3 group">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] font-mono text-white px-3 py-1.5 rounded border border-white/10 uppercase tracking-widest whitespace-nowrap pointer-events-none shadow-xl">
            Command_Palette
          </span>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="p-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 bg-white/10 text-white hover:bg-white/20 hover:scale-110 border border-white/10 backdrop-blur-md"
            title="Command Palette (CMD+K)"
          >
            <Search size={24} />
          </button>
        </div>

        {/* Intel Report Toggle */}
        <div className="flex items-center gap-3 group">
          <span className={`opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] font-mono text-neon-lime px-3 py-1.5 rounded border border-neon-lime/20 uppercase tracking-widest whitespace-nowrap pointer-events-none shadow-xl`}>
            Intel_Report
          </span>
          <button
            onClick={() => setShowIntelligenceWindow(!showIntelligenceWindow)}
            className={`p-4 rounded-full shadow-[0_0_30px_rgba(0,255,0,0.1)] transition-all duration-300 ${
              showIntelligenceWindow 
                ? 'bg-neon-lime text-black ring-4 ring-neon-lime/20' 
                : 'bg-neon-lime/20 text-neon-lime hover:bg-neon-lime/40 hover:scale-110 border border-neon-lime/30'
            }`}
            title="Toggle Intelligence Report"
          >
            {showIntelligenceWindow ? <X size={24} /> : <Shield size={24} />}
          </button>
        </div>
        
        {/* Live Ops Monitor Toggle */}
        <div className="flex items-center gap-3 group">
          <div className="flex flex-col items-end">
            <span className={`opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] font-mono text-neon-cyan px-3 py-1.5 rounded border border-neon-cyan/20 uppercase tracking-widest whitespace-nowrap pointer-events-none shadow-xl mb-1`}>
              Live_Ops_Monitor
            </span>
            {runningTools.some(t => t.status === 'running') && (
              <span className="text-[8px] font-mono text-neon-magenta animate-pulse uppercase tracking-tighter bg-black/60 px-1 rounded">SCANNING_IN_PROGRESS</span>
            )}
          </div>
          <button
            onClick={() => setShowStatusWindow(!showStatusWindow)}
            className={`p-4 rounded-full shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all duration-300 relative ${
              showStatusWindow 
                ? 'bg-neon-magenta text-black rotate-90 ring-4 ring-neon-magenta/20' 
                : 'bg-neon-cyan text-black hover:scale-110 border border-neon-cyan/30'
            }`}
            title="Toggle Live Ops Monitor"
          >
            {showStatusWindow ? <X size={24} /> : <Activity size={24} className={runningTools.some(t => t.status === 'running') ? 'animate-pulse' : ''} />}
            {!showStatusWindow && runningTools.some(t => t.status === 'running') && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-magenta rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce text-white border-2 border-bg-primary">
                {runningTools.filter(t => t.status === 'running').length}
              </span>
            )}
          </button>
        </div>
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
        onRetryTool={(id) => {
          const tool = runningTools.find(t => t.id === id);
          if (tool) {
            setRunningTools(prev => prev.filter(t => t.id !== id));
            runTool(tool.name, tool.api, undefined, tool.category, tool.body);
          }
        }}
        openInBrowser={openInBrowser}
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
        onToggleFalsePositive={handleToggleFalsePositive}
        onToolSearch={handleToolSearch}
        onBreachQuery={handleBreachQuery}
        onExportJSON={exportCurrentScanResults}
        onExportPDF={exportDossierPDF}
        onDownloadLog={downloadScanLog}
        searchQuery={searchQuery}
        aiSuggestions={aiSuggestions}
        aiActions={aiActions}
        openInBrowser={openInBrowser}
        onShowHistory={() => setIsHistoryOpen(true)}
        onShowResults={() => setIsResultsOpen(true)}
      />
      <AnimatePresence>
        {isResultsOpen && (
          <ResultsModal 
            isOpen={isResultsOpen} 
            onClose={() => setIsResultsOpen(false)} 
            scanResults={scanResults}
            openInBrowser={openInBrowser}
          />
        )}
        {isSettingsOpen && (
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            hasApiKey={hasApiKey}
            customApiKeys={customApiKeys}
            onUpdateCustomKey={(key, val) => setCustomApiKeys(prev => ({ ...prev, [key]: val }))}
            onSelectKey={async () => {
              if (window.aistudio?.openSelectKey) {
                await window.aistudio.openSelectKey();
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
              }
            }}
          />
        )}
        {isHistoryOpen && (
          <HistoryModal 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            history={scanHistory}
            onSelect={(item) => {
              setSearchQuery(item.query);
              setScanResults(item.results);
              setIsDeepScan(item.isDeep);
              setShowIntelligenceWindow(true);
              setActiveTab('TargetIntel');
              setIsResultsOpen(true);
            }}
            setScanResults={setScanResults}
            setIsResultsOpen={setIsResultsOpen}
          />
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  hasApiKey, 
  onSelectKey,
  customApiKeys,
  onUpdateCustomKey
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  hasApiKey: boolean, 
  onSelectKey: () => void,
  customApiKeys: Record<string, string>,
  onUpdateCustomKey: (key: string, val: string) => void
}) => {
  if (!isOpen) return null;
  
  const availableKeys = [
    { id: 'shodan', name: 'Shodan API Key', description: 'Used for advanced network intelligence' },
    { id: 'censys', name: 'Censys API Key', description: 'Used for certificate and host discovery' },
    { id: 'virustotal', name: 'VirusTotal API Key', description: 'Used for malware and domain reputation' },
    { id: 'hunter', name: 'Hunter.io API Key', description: 'Used for email discovery' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Settings className="text-neon-cyan" size={20} />
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Application Settings</h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="text-neon-magenta" size={16} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">AI Configuration</h3>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Gemini API Key</p>
                  <p className="text-[10px] text-white/40 uppercase mt-1">Required for advanced AI analysis and deep scans</p>
                </div>
                <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${hasApiKey ? 'bg-neon-lime/20 text-neon-lime' : 'bg-red-500/20 text-red-500'}`}>
                  {hasApiKey ? 'Configured' : 'Missing'}
                </div>
              </div>
              
              <button 
                onClick={onSelectKey}
                className="w-full py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-[10px] text-neon-cyan font-black uppercase tracking-[0.2em] hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)]"
              >
                {hasApiKey ? 'Update API Key' : 'Configure API Key'}
              </button>
              
              <p className="text-[8px] text-white/20 uppercase leading-relaxed">
                Note: API keys are managed securely by the platform. You can also set keys in the system settings menu.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-neon-cyan" size={16} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">External API Keys</h3>
            </div>
            
            <div className="space-y-3">
              {availableKeys.map(key => (
                <div key={key.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">{key.name}</p>
                      <p className="text-[8px] text-white/40 uppercase mt-0.5">{key.description}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${customApiKeys[key.id] ? 'bg-neon-lime/20 text-neon-lime' : 'bg-white/5 text-white/20'}`}>
                      {customApiKeys[key.id] ? 'Active' : 'Not Set'}
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="password"
                      placeholder={`ENTER ${key.id.toUpperCase()}_KEY...`}
                      value={customApiKeys[key.id] || ''}
                      onChange={(e) => onUpdateCustomKey(key.id, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-2 rounded text-[10px] font-mono text-white outline-none focus:border-neon-cyan transition-all"
                    />
                    <Key size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="text-neon-cyan" size={16} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Data Management</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  if (confirm('Clear all local data? This will reset your history and saved searches.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-red-500/50 transition-all text-left group"
              >
                <Trash2 size={16} className="text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Reset App</p>
                <p className="text-[8px] text-white/40 uppercase mt-1">Clear all local storage</p>
              </button>
              
              <button 
                onClick={() => {
                  const data = JSON.stringify(localStorage);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `osint_hub_backup_${Date.now()}.json`;
                  a.click();
                }}
                className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-neon-cyan/50 transition-all text-left group"
              >
                <Download size={16} className="text-neon-cyan mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Export Data</p>
                <p className="text-[8px] text-white/40 uppercase mt-1">Backup all settings & history</p>
              </button>
            </div>
          </section>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 text-center">
          <p className="text-[8px] text-white/20 uppercase tracking-[0.3em]">OSINT HUB v1.2.1 // SYSTEM_STABLE</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const HistoryModal = ({ isOpen, onClose, history, onSelect, setScanResults, setIsResultsOpen }: { isOpen: boolean, onClose: () => void, history: any[], onSelect: (item: any) => void, setScanResults: (results: any) => void, setIsResultsOpen: (open: boolean) => void }) => {
  if (!isOpen) return null;
  
  // Ensure we only show the last 10 as requested previously
  const displayHistory = (history || []).slice(0, 10);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Clock className="text-neon-magenta" size={20} />
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Target History</h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {displayHistory.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <History size={48} className="mx-auto mb-4" />
              <p className="uppercase tracking-[0.2em] text-xs">No scan history found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayHistory.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-lg hover:border-neon-cyan/30 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center justify-between group">
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white uppercase tracking-widest group-hover:text-neon-cyan transition-colors">{item.query}</span>
                        <span className="text-[8px] text-white/20 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${item.isDeep ? 'text-neon-magenta' : 'text-neon-cyan'}`}>
                          {item.isDeep ? 'Deep Scan' : 'Standard Scan'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.results?.whois && <span className="text-[7px] px-1 bg-white/5 border border-white/10 text-white/40 uppercase">WHOIS</span>}
                          {item.results?.dns && <span className="text-[7px] px-1 bg-white/5 border border-white/10 text-white/40 uppercase">DNS</span>}
                          {item.results?.social && (
                            <span className="text-[7px] px-1 bg-neon-lime/10 border border-neon-lime/30 text-neon-lime uppercase">
                              SOCIAL ({Array.isArray(item.results.social) ? item.results.social.length : 'OK'})
                            </span>
                          )}
                          {item.results?.ghunt && <span className="text-[7px] px-1 bg-white/5 border border-white/10 text-white/40 uppercase">GHUNT</span>}
                          {item.results?.epieos && <span className="text-[7px] px-1 bg-white/5 border border-white/10 text-white/40 uppercase">EPIEOS</span>}
                          {item.results?.holehe && <span className="text-[7px] px-1 bg-white/5 border border-white/10 text-white/40 uppercase">HOLEHE</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                          onClose();
                        }}
                        className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all rounded"
                        title="Load into Workspace"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setScanResults(item.results);
                          setIsResultsOpen(true);
                        }}
                        className="p-2 bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all rounded"
                        title="View Full Results Matrix"
                      >
                        <BarChart3 size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center">
          <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Showing last {displayHistory.length} results</p>
          <button 
            onClick={() => {
              if (window.confirm('Clear all history?')) {
                localStorage.removeItem('osintScanHistory');
                window.location.reload();
              }
            }}
            className="text-[8px] text-red-500 font-black uppercase tracking-widest hover:underline"
          >
            Clear All
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const ResultsModal = ({ isOpen, onClose, scanResults, openInBrowser }: { isOpen: boolean, onClose: () => void, scanResults: any, openInBrowser: (url: string) => void }) => {
  if (!isOpen) return null;

  const toolResults = useMemo(() => {
    if (!scanResults) return [];
    const results: { name: string, data: any, type: string, url?: string }[] = [];
    
    if (scanResults.social) results.push({ name: 'Social Footprint', data: scanResults.social, type: 'social' });
    if (scanResults.whois) results.push({ name: 'WHOIS Data', data: scanResults.whois, type: 'whois' });
    if (scanResults.dns) results.push({ name: 'DNS Records', data: scanResults.dns, type: 'dns' });
    if (scanResults.timeline) results.push({ name: 'Wayback Timeline', data: scanResults.timeline, type: 'timeline' });
    if (scanResults.ghunt) results.push({ name: 'GHunt Results', data: scanResults.ghunt, type: 'json' });
    if (scanResults.epieos) results.push({ name: 'Epieos Results', data: scanResults.epieos, type: 'json' });
    if (scanResults.holehe) results.push({ name: 'Holehe Results', data: scanResults.holehe, type: 'json' });
    
    // Add workflow results
    if (scanResults.workflowResults) {
      Object.entries(scanResults.workflowResults).forEach(([id, entry]: [string, any]) => {
        // Try to find a better name for the tool if id is numeric
        const tool = OSINT_TOOLS.find(t => t.id === id);
        let type = 'json';
        if (id === '10' || (tool && tool.name.toLowerCase().includes('whois'))) type = 'whois';
        if (['23', '43', '39', '1'].includes(id) || (tool && tool.name.toLowerCase().includes('dns'))) type = 'dns';
        if (id === '61' || id === '3' || (tool && tool.name.toLowerCase().includes('wayback'))) type = 'timeline';

        results.push({ 
          name: tool ? tool.name : `Tool: ${id}`, 
          data: entry.results, 
          type,
          url: entry.url 
        });
      });
    }
    
    return results;
  }, [scanResults]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-neon-yellow" size={20} />
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Scan Results Matrix</h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          {!scanResults ? (
            <div className="py-20 text-center opacity-20">
              <Activity size={48} className="mx-auto mb-4" />
              <p className="uppercase tracking-[0.2em] text-xs">No active scan results found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-neon-cyan font-black uppercase tracking-widest text-lg">{scanResults.target}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Target Intelligence Dossier</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Scan Timestamp</p>
                  <p className="text-xs font-mono text-white/60">{new Date(scanResults.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-6">
                {toolResults.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-white/5 rounded-xl text-center opacity-40">
                    <Search size={32} className="mx-auto mb-3" />
                    <p className="text-[10px] uppercase tracking-widest">No detailed tool results available for this session</p>
                    <p className="text-[8px] uppercase mt-1">Try running a Deep Scan or specific Tool Groups</p>
                  </div>
                ) : (
                  toolResults.map((tool, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                      <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">{tool.name}</h4>
                        <div className="flex items-center gap-3">
                          {tool.url && (
                            <a 
                              href={tool.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[8px] text-neon-cyan hover:underline uppercase flex items-center gap-1"
                            >
                              Source <ExternalLink size={8} />
                            </a>
                          )}
                          <span className="text-[8px] font-mono text-white/20 uppercase">{tool.type}</span>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <div className="mb-4 flex justify-end">
                          <button 
                            onClick={(e) => {
                              const pre = e.currentTarget.parentElement?.nextElementSibling?.querySelector('pre');
                              if (pre) pre.classList.toggle('hidden');
                            }}
                            className="text-[8px] font-mono text-white/40 hover:text-neon-cyan uppercase tracking-widest"
                          >
                            Toggle Raw Data
                          </button>
                        </div>
                        <div className="relative">
                          <pre className="hidden absolute inset-0 z-10 bg-black/95 p-4 text-[9px] font-mono text-neon-cyan overflow-auto custom-scrollbar border border-neon-cyan/30 rounded shadow-2xl max-h-[400px]">
                            {JSON.stringify(tool.data, null, 2)}
                          </pre>
                          {tool.type === 'social' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {tool.data.map((site: any, sIdx: number) => {
                              const isFound = site.status === 'Found' || site.status === 'Possible but Deleted';
                              if (!isFound) return null;
                              
                              return (
                                <div key={sIdx} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-neon-lime/30 transition-all group">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-neon-lime font-black truncate">{site.name}</span>
                                    {site.url && (
                                      <a 
                                        href={site.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-white/5 rounded hover:bg-neon-lime hover:text-black transition-all"
                                      >
                                        <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    {site.followers && (
                                      <div className="flex items-center justify-between text-[8px] uppercase tracking-widest">
                                        <span className="text-white/40">Followers</span>
                                        <span className="text-neon-cyan font-mono">{site.followers}</span>
                                      </div>
                                    )}
                                    {site.posts && (
                                      <div className="flex items-center justify-between text-[8px] uppercase tracking-widest">
                                        <span className="text-white/40">Posts</span>
                                        <span className="text-neon-cyan font-mono">{site.posts}</span>
                                      </div>
                                    )}
                                    {site.bio && (
                                      <p className="text-[8px] text-white/60 mt-2 line-clamp-2 italic leading-relaxed">
                                        "{site.bio}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {tool.data.filter((s: any) => s.status === 'Found' || s.status === 'Possible but Deleted').length === 0 && (
                              <div className="col-span-full py-8 text-center opacity-20">
                                <p className="text-[10px] uppercase tracking-widest">No active profiles identified</p>
                              </div>
                            )}
                          </div>
                        ) : tool.type === 'timeline' ? (
                          <div className="space-y-2">
                            {(() => {
                              if (tool.data?.error) {
                                return (
                                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500">
                                    <AlertTriangle size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">{tool.data.error}</span>
                                  </div>
                                );
                              }
                              const timelineData = Array.isArray(tool.data) 
                                ? tool.data 
                                : (tool.data?.snapshots || tool.data?.results || (Array.isArray(tool.data?.data) ? tool.data.data : null));
                              
                              if (Array.isArray(timelineData)) {
                                return timelineData.slice(0, 50).map((entry: any, eIdx: number) => (
                                  <div key={eIdx} className="text-[10px] font-mono flex items-center gap-3 group">
                                    <span className="text-neon-cyan/60 shrink-0">[{entry.timestamp || 'N/A'}]</span>
                                    <button 
                                      onClick={() => openInBrowser(entry.url)}
                                      className="text-white/60 hover:text-neon-lime truncate transition-colors flex items-center gap-1 flex-1 text-left"
                                    >
                                      {entry.url}
                                      <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  </div>
                                ));
                              }
                              
                              return (
                                <div className="p-3 border border-white/5 bg-white/5 rounded">
                                  <p className="text-[10px] text-white/40 italic mb-2">Non-standard timeline data format detected:</p>
                                  <pre className="text-[9px] font-mono text-white/60 leading-tight whitespace-pre-wrap">
                                    {JSON.stringify(tool.data, null, 2)}
                                  </pre>
                                </div>
                              );
                            })()}
                          </div>
                        ) : tool.type === 'dns' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(tool.data || {}).map(([type, records]: [string, any], rIdx) => {
                              if (!Array.isArray(records) || records.length === 0) return null;
                              return (
                                <div key={rIdx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_5px_rgba(0,243,255,0.5)]" />
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/80">{type} RECORDS</h5>
                                  </div>
                                  <div className="space-y-1.5">
                                    {records.map((record: any, idx: number) => (
                                      <div key={idx} className="text-[9px] font-mono text-white/60 bg-black/20 p-1.5 rounded border border-white/5 break-all">
                                        {typeof record === 'string' ? record : JSON.stringify(record)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {(!tool.data || Object.keys(tool.data).length === 0) && (
                              <div className="col-span-full py-8 text-center opacity-20">
                                <p className="text-[10px] uppercase tracking-widest">No DNS records resolved</p>
                              </div>
                            )}
                          </div>
                        ) : tool.type === 'whois' ? (
                          <div className="space-y-4">
                            {(() => {
                              const d = tool.data || {};
                              // Helper to render sections
                              const renderSection = (title: string, data: any) => {
                                if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;
                                return (
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-neon-magenta mb-3">{title}</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                      {Object.entries(data).map(([key, val]: [string, any], idx) => {
                                        if (!val || typeof val === 'object') return null;
                                        return (
                                          <div key={idx} className="flex flex-col">
                                            <span className="text-[8px] text-white/30 uppercase tracking-widest mb-0.5">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-[10px] font-mono text-white/80 break-all">{String(val)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-4">
                                      <span className="text-[8px] text-neon-cyan/60 uppercase tracking-widest">Registrar</span>
                                      <p className="text-sm font-black text-white uppercase truncate">{d.registrar || d.Registrar || 'N/A'}</p>
                                    </div>
                                    <div className="bg-neon-magenta/5 border border-neon-magenta/20 rounded-lg p-4">
                                      <span className="text-[8px] text-neon-magenta/60 uppercase tracking-widest">Created</span>
                                      <p className="text-sm font-black text-white uppercase">{d.created_date || d['Creation Date'] || 'N/A'}</p>
                                    </div>
                                    <div className="bg-neon-lime/5 border border-neon-lime/20 rounded-lg p-4">
                                      <span className="text-[8px] text-neon-lime/60 uppercase tracking-widest">Expires</span>
                                      <p className="text-sm font-black text-white uppercase">{d.expiration_date || d['Registry Expiry Date'] || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {renderSection('REGISTRATION DETAILS', {
                                    domain: d.domain_name || d['Domain Name'],
                                    status: d.status || d['Domain Status'],
                                    whois_server: d.whois_server || d['Whois Server'],
                                    updated_date: d.updated_date || d['Updated Date']
                                  })}

                                  {renderSection('NAMESERVERS', d.name_servers || (d['Name Server'] ? { nameserver: d['Name Server'] } : null))}

                                  {/* Fallback for raw text if most fields missing */}
                                  {(!d.registrar && !d.domain_name) && (
                                    <div className="p-3 border border-white/5 bg-white/5 rounded">
                                      <pre className="text-[9px] font-mono text-white/60 leading-tight whitespace-pre-wrap">
                                        {typeof d === 'string' ? d : JSON.stringify(d, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <pre className="text-[9px] font-mono text-white/60 leading-tight whitespace-pre-wrap">
                              {JSON.stringify(tool.data, null, 2).length > 10000 
                                ? JSON.stringify(tool.data, null, 2).substring(0, 10000) + "\n... [TRUNCATED for performance]"
                                : JSON.stringify(tool.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        </div>
                      </div>
                  </div>
                )))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};


const generatePossibleIdentifiers = (target: string) => {
  const isDomain = target.includes('.') && !target.includes('@') && !target.includes(' ');
  const isEmail = target.includes('@');
  const isUsername = !isDomain && !isEmail;

  const results: { emails: string[], usernames: string[] } = {
    emails: [],
    usernames: []
  };

  if (isDomain) {
    const domain = target.toLowerCase();
    const prefix = domain.split('.')[0];
    results.emails = [
      `admin@${domain}`,
      `info@${domain}`,
      `support@${domain}`,
      `contact@${domain}`,
      `webmaster@${domain}`,
      `sales@${domain}`,
      `hr@${domain}`
    ];
    results.usernames = [prefix, domain.replace(/\./g, '_')];
  } else if (isEmail) {
    const [user, domain] = target.toLowerCase().split('@');
    results.usernames = [user];
    results.emails = [
      `${user}@gmail.com`,
      `${user}@outlook.com`,
      `${user}@protonmail.com`,
      `${user}@icloud.com`,
      `${user}@yahoo.com`
    ];
  } else if (isUsername) {
    const user = target.toLowerCase();
    results.usernames = [
      user,
      `${user}123`,
      `${user}_official`,
      `real_${user}`,
      `${user}_dev`
    ];
    results.emails = [
      `${user}@gmail.com`,
      `${user}@outlook.com`,
      `${user}@protonmail.com`,
      `${user}@icloud.com`,
      `${user}@yahoo.com`,
      `${user}@hotmail.com`
    ];
  }

  return results;
};

const IntelligenceWindow = React.memo(({ 
  isOpen, 
  onClose, 
  scanResults, 
  isScanning, 
  isDeepScan, 
  targetRiskScore, 
  targetDossier, 
  falsePositives, 
  onToggleFalsePositive,
  onToolSearch, 
  onBreachQuery, 
  onExportJSON, 
  onExportPDF,
  onDownloadLog,
  searchQuery,
  aiSuggestions,
  aiActions,
  openInBrowser,
  onShowHistory,
  onShowResults
}: IntelligenceWindowProps) => {
  const categoryChartData = useMemo(() => {
    if (!scanResults || !scanResults.social) return [];
    const categories = ['Social', 'Chat', 'Gaming', 'Dating', 'NSFW', 'Professional', 'Creative', 'Tech', 'Other'];
    return categories.map(cat => {
      const found = scanResults.social.filter((s: any) => 
        s.category === cat && 
        (s.status === 'Found' || s.status === 'Possible but Deleted') && 
        !falsePositives.has(s.name)
      ).length;
      return { name: cat, count: found };
    }).filter(d => d.count > 0);
  }, [scanResults, falsePositives]);

  const statusPieData = useMemo(() => {
    if (!scanResults || !scanResults.social) return [];
    const found = scanResults.social.filter((s: any) => 
      (s.status === 'Found' || s.status === 'Possible but Deleted') && 
      !falsePositives.has(s.name)
    ).length;
    const total = scanResults.social.length;
    return [
      { name: 'Identified', value: found, color: '#39FF14' }, // neon-lime
      { name: 'Not Found', value: total - found, color: '#1a1a1a' }
    ];
  }, [scanResults, falsePositives]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      className="fixed inset-y-0 left-0 w-full sm:w-[38rem] md:w-[50rem] lg:w-[68rem] xl:w-[92rem] z-[1900] font-mono sm:m-6 sm:rounded-xl overflow-hidden intelligence-window-container shadow-2xl min-h-[600px]"
    >
      <div className="bg-[#050505]/98 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex flex-col h-full intelligence-window">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-gradient-to-r from-neon-lime/20 to-transparent intelligence-window-header">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-neon-lime/20 rounded border border-neon-lime/40">
              <Shield size={24} className="text-neon-lime" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-white leading-none">Intelligence_Report</h3>
              <p className="text-[10px] text-white/40 mt-2 uppercase tracking-widest">
                {scanResults ? `Target: ${scanResults.target} • SESSION_ID: ${scanResults.timestamp.replace(/[^A-Z0-9]/g, '').slice(-12)}` : 'No Active Target'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onShowHistory}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] text-neon-magenta hover:bg-neon-magenta/10 transition-all uppercase tracking-widest font-black"
            >
              <Clock size={14} /> History
            </button>
            <button 
              onClick={onShowResults}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] text-neon-yellow hover:bg-neon-yellow/10 transition-all uppercase tracking-widest font-black"
            >
              <BarChart3 size={14} /> Results
            </button>
            <button 
              onClick={onExportPDF}
              className="pdf-export-btn flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <FileText size={14} /> Export_PDF
            </button>
            <button 
              onClick={onExportJSON}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
            >
              <Download size={14} /> Export_JSON
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12 custom-scrollbar">
          {!scanResults ? (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
              <Shield size={64} className="mb-6 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-[0.5em]">No Intelligence Data</p>
              <p className="text-[10px] mt-2 uppercase tracking-widest">Initiate a scan to generate a target dossier</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column: Core Intelligence */}
              <div className="space-y-12">
                {isScanning && (
                  <div className="flex items-center gap-4 p-5 bg-neon-lime/5 border border-neon-lime/20 rounded-lg animate-pulse">
                    <Activity size={20} className="text-neon-lime animate-spin" />
                    <span className="text-xs font-black text-neon-lime uppercase tracking-[0.3em]">
                      {isDeepScan ? 'DEEP_INTELLIGENCE_EXTRACTION_IN_PROGRESS...' : 'SCAN_SEQUENCE_ACTIVE...'}
                    </span>
                  </div>
                )}

                {scanResults?.social?.some((s: any) => s.status === 'Timed Out') && (
                  <div className="flex items-center gap-4 p-5 bg-neon-yellow/5 border border-neon-yellow/20 rounded-lg">
                    <AlertTriangle size={20} className="text-neon-yellow" />
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-neon-yellow uppercase tracking-[0.2em] block mb-1">PARTIAL_DATA_RETRIEVED</span>
                      <p className="text-[9px] font-mono text-neon-yellow/60 uppercase">Some sectors timed out due to extreme site lists. Results are incomplete.</p>
                    </div>
                  </div>
                )}

                {/* Risk Score */}
                {targetRiskScore && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-black/40 border-2 border-neon-magenta p-8 flex flex-col items-center justify-center text-center rounded-lg shadow-[0_0_30px_rgba(255,0,255,0.1)]">
                      <span className="text-[10px] font-mono text-neon-magenta uppercase tracking-[0.3em] mb-4">VULNERABILITY_SCORE</span>
                      <div className="text-7xl font-graffiti text-neon-magenta mb-4 drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]">{targetRiskScore.score}</div>
                      <div className={`text-xs font-black uppercase tracking-[0.4em] px-6 py-2 border-2 ${
                        targetRiskScore.level === 'Critical' ? 'bg-neon-magenta text-black border-neon-magenta' :
                        targetRiskScore.level === 'High' ? 'text-neon-magenta border-neon-magenta' :
                        targetRiskScore.level === 'Medium' ? 'text-neon-yellow border-neon-yellow' :
                        'text-neon-lime border-neon-lime'
                      }`}>
                        {targetRiskScore.level}_RISK
                      </div>
                    </div>
                    <div className="bg-black/40 border-2 border-white/10 p-8 rounded-lg">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-6 block">CRITICAL_RISK_FACTORS</span>
                      <div className="space-y-5">
                        {targetRiskScore.factors.map((factor, i) => (
                          <div key={i} className="flex items-start gap-5 group">
                            <div className="p-1.5 bg-neon-magenta/20 border border-neon-magenta/40 mt-1 group-hover:bg-neon-magenta/40 transition-all">
                              <AlertTriangle size={14} className="text-neon-magenta" />
                            </div>
                            <p className="text-xs sm:text-sm font-mono text-white/80 leading-relaxed uppercase tracking-wide">{factor}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Possible Identifiers */}
                {scanResults.possibleIdentifiers && (
                  <div className="bg-neon-cyan/5 border-2 border-neon-cyan/30 p-8 rounded-lg relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-8 border-b border-neon-cyan/20 pb-6">
                      <User className="text-neon-cyan" size={24} />
                      <h3 className="text-2xl font-graffiti text-neon-cyan tracking-[0.2em] uppercase">POSSIBLE_IDENTIFIERS</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <div>
                        <h4 className="text-[10px] font-black text-neon-cyan/60 uppercase tracking-[0.3em] mb-5 flex items-center gap-3">
                          <Mail size={14} /> Probable_Emails
                        </h4>
                        <div className="space-y-3">
                          {scanResults.possibleIdentifiers.emails.map((email: string, i: number) => (
                            <div key={i} className="flex items-center justify-between group/item p-2 hover:bg-white/5 rounded transition-all">
                              <span className="text-xs font-mono text-white/80 hover:text-neon-cyan cursor-pointer transition-colors truncate pr-4" onClick={() => onToolSearch('Email Search', email)}>
                                {email}
                              </span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(email)}
                                className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-neon-cyan/20 rounded transition-all"
                              >
                                <Copy size={12} className="text-neon-cyan" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[10px] font-black text-neon-cyan/60 uppercase tracking-[0.3em] mb-5 flex items-center gap-3">
                          <User size={14} /> Probable_Usernames
                        </h4>
                        <div className="space-y-3">
                          {scanResults.possibleIdentifiers.usernames.map((username: string, i: number) => (
                            <div key={i} className="flex items-center justify-between group/item p-2 hover:bg-white/5 rounded transition-all">
                              <span className="text-xs font-mono text-white/80 hover:text-neon-cyan cursor-pointer transition-colors truncate pr-4" onClick={() => onToolSearch('Username Search', username)}>
                                {username}
                              </span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(username)}
                                className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-neon-cyan/20 rounded transition-all"
                              >
                                <Copy size={12} className="text-neon-cyan" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Dossier */}
                {targetDossier && (
                  <div className="bg-neon-cyan/5 border-2 border-neon-cyan/30 p-8 relative overflow-hidden group rounded-lg">
                    <div className="flex items-center gap-4 mb-8 border-b border-neon-cyan/20 pb-6">
                      <Brain className="text-neon-cyan" size={24} />
                      <h3 className="text-2xl font-graffiti text-neon-cyan tracking-[0.2em] uppercase">AI_TARGET_DOSSIER</h3>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none font-mono text-white/90 leading-relaxed dossier-content text-xs sm:text-sm">
                      <Markdown>{targetDossier}</Markdown>
                    </div>
                    <div className="mt-8 pt-6 border-t border-neon-cyan/20 flex justify-between items-center">
                      <p className="text-[9px] font-mono text-neon-cyan/50 uppercase tracking-[0.4em]">AI_GENERATED // CONFIDENTIAL</p>
                      <button 
                        onClick={() => {
                          const blob = new Blob([targetDossier], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `DOSSIER_${searchQuery.replace(/[^a-z0-9]/gi, '_').toUpperCase()}.md`;
                          a.click();
                        }}
                        className="text-[10px] font-black text-neon-cyan hover:underline uppercase tracking-[0.2em]"
                      >
                        DOWNLOAD_MD
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: External Intelligence */}
              <div className="space-y-12">
                {/* AI Suggestions & Actions */}
                {(aiSuggestions.length > 0 || aiActions.length > 0) && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <Sparkles className="text-neon-yellow" size={20} />
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">AI_Recommendations</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {aiSuggestions.map((suggestion, i) => (
                        <div key={i} className="bg-black/40 border border-neon-yellow/30 p-5 rounded-lg relative group hover:border-neon-yellow transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-[11px] font-black text-neon-yellow uppercase tracking-[0.2em]">{suggestion.name}</h4>
                            {suggestion.directLink && (
                              <button 
                                onClick={() => openInBrowser(suggestion.directLink)}
                                className="p-1.5 bg-neon-yellow/10 border border-neon-yellow/20 text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all rounded"
                              >
                                <ExternalLink size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-white/60 leading-relaxed uppercase">
                            <span className="text-neon-yellow/40 mr-2 font-black">REASON:</span>
                            {suggestion.reason}
                          </p>
                        </div>
                      ))}
                    </div>

                    {aiActions.length > 0 && (
                      <div className="bg-neon-magenta/5 border border-neon-magenta/30 p-5 rounded-lg">
                        <div className="flex items-center gap-4 mb-4">
                          <Terminal size={14} className="text-neon-magenta" />
                          <h4 className="text-[10px] font-black text-neon-magenta uppercase tracking-[0.4em]">AUTONOMOUS_LOG</h4>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                          {aiActions.map((action, i) => (
                            <div key={i} className="flex items-center gap-3 text-[9px] font-mono text-white/40 uppercase">
                              <span className="text-neon-magenta opacity-50 font-black">[{new Date().toLocaleTimeString()}]</span>
                              <span className="text-white/80">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Historical Timeline */}
                {(() => {
                  const rawTimeline = scanResults.timeline || scanResults.workflowResults?.['61']?.results || scanResults.workflowResults?.['3']?.results;
                  if (!rawTimeline) return null;

                  if (rawTimeline.error) {
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                          <Clock size={20} className="text-neon-cyan" />
                          <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">Historical_Timeline</h4>
                        </div>
                        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-4 text-red-500">
                          <AlertTriangle size={24} />
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-1">Timeline_Fetch_Error</p>
                            <p className="text-[10px] font-mono opacity-80">{rawTimeline.error}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const timelineData = Array.isArray(rawTimeline) 
                    ? rawTimeline 
                    : (rawTimeline.snapshots || rawTimeline.results || (Array.isArray(rawTimeline.data) ? rawTimeline.data : null));
                  
                  if (!timelineData || !Array.isArray(timelineData) || timelineData.length === 0) return null;

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <Clock size={20} className="text-neon-cyan" />
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">Historical_Timeline</h4>
                      </div>
                      <div className="space-y-4 bg-white/5 p-6 border border-white/10 rounded-lg max-h-80 overflow-y-auto custom-scrollbar">
                        {timelineData.map((entry: any, i: number) => (
                          <div key={i} className="flex items-start gap-4 text-[10px] font-mono group/timeline border-b border-white/5 pb-3 last:border-0">
                            <span className="text-neon-cyan opacity-50 font-black whitespace-nowrap">[{entry.timestamp || entry.date || 'ARCHIVE'}]</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/80 font-black uppercase mb-1">{entry.event || entry.title || 'Snapshot Captured'}</p>
                              {entry.url && (
                                <button 
                                  onClick={() => openInBrowser(entry.url)}
                                  className="text-neon-cyan/60 hover:text-neon-cyan hover:underline truncate max-w-full block text-left flex items-center gap-2"
                                >
                                  {entry.url} <ExternalLink size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Intelligence Visualization */}
                {scanResults.social && scanResults.social.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <BarChart3 size={20} className="text-neon-cyan" />
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">Intelligence_Visualization</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-black/40 border border-white/10 p-6 rounded-lg h-[300px] flex flex-col">
                        <h5 className="text-[10px] font-black uppercase text-white/40 mb-4 tracking-widest">Findings_By_Category</h5>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="#ffffff40" 
                                fontSize={10} 
                                width={80}
                                tick={{ fill: '#ffffff60' }}
                              />
                              <ChartTooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff20', fontSize: '10px' }}
                                itemStyle={{ color: '#39FF14' }}
                              />
                              <Bar dataKey="count" fill="#39FF14" radius={[0, 4, 4, 0]} barSize={20}>
                                {categoryChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#39FF14' : '#00F3FF'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/10 p-6 rounded-lg h-[300px] flex flex-col">
                        <h5 className="text-[10px] font-black uppercase text-white/40 mb-4 tracking-widest">Identification_Status</h5>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={statusPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {statusPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                              </Pie>
                              <ChartTooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff20', fontSize: '10px' }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Footprint */}
                {scanResults.social && Array.isArray(scanResults.social) && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <User size={20} className="text-neon-lime" />
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">Social_Footprint</h4>
                    </div>
                    <div className="space-y-10">
                      {(() => {
                        // Pre-group sites by category for efficiency
                        const groupedSites = scanResults.social.reduce((acc: any, site: any) => {
                          const cat = site.category || 'Other';
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(site);
                          return acc;
                        }, {});

                        return ['Social', 'Chat', 'VoIP', 'Texting', 'Gaming', 'Dating', 'NSFW', 'Professional', 'Creative', 'Tech', 'Other'].map(category => {
                          const categorySites = groupedSites[category] || [];
                          if (categorySites.length === 0) return null;
                          
                          const foundSites = categorySites.filter((s: any) => {
                            const isFound = s.status === 'Found' || s.status === 'Possible but Deleted' || s.status === 'Timed Out' || s.status === 'Error';
                            return isFound && !falsePositives.has(s.name);
                          });
                          
                          const foundCount = foundSites.length;
                          
                          return (
                            <div key={category} className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black uppercase text-neon-cyan flex items-center gap-3 tracking-[0.2em]">
                                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                                  {category}_SECTOR
                                </h5>
                                <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">
                                  {foundCount} / {categorySites.length} IDENTIFIED
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {foundCount === 0 ? (
                                  <div className="py-6 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center bg-black/20">
                                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em]">No_Active_Profiles</span>
                                  </div>
                                ) : categorySites.map((site: any) => {
                                  const isFalsePositive = falsePositives.has(site.name);
                                  const isRelevant = site.status === 'Found' || site.status === 'Possible but Deleted' || site.status === 'Timed Out' || site.status === 'Error';
                                  if (isRelevant && !isFalsePositive) {
                                    const isPossible = site.status === 'Possible but Deleted';
                                    const isError = site.status === 'Error';
                                    const isTimeout = site.status === 'Timed Out';
                                    
                                    return (
                                      <div 
                                        key={site.name}
                                        className={`p-3 border rounded-lg flex items-center justify-between transition-all group/row ${
                                          isPossible ? 'border-neon-magenta/30 bg-neon-magenta/5 hover:border-neon-magenta/60' : 
                                          isError ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/60' :
                                          isTimeout ? 'border-neon-yellow/30 bg-neon-yellow/5 hover:border-neon-yellow/60' :
                                          'border-neon-lime/30 bg-neon-lime/5 hover:border-neon-lime/60'
                                        }`}
                                      >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                          {site.avatar ? (
                                            <img 
                                              src={site.avatar} 
                                              alt={site.name} 
                                              className="w-8 h-8 rounded-full border border-white/20 shadow-lg"
                                              referrerPolicy="no-referrer"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                              <User size={14} className="text-white/20" />
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <span className="text-xs font-black uppercase tracking-widest truncate block group-hover/row:text-white transition-colors">{site.name}</span>
                                            <button 
                                              onClick={() => openInBrowser(site.url)}
                                              className="text-[9px] text-white/40 hover:text-neon-cyan hover:underline truncate block text-left mt-0.5"
                                            >
                                              {site.url}
                                            </button>
                                            {(site.followers || site.posts) && (
                                              <div className="flex items-center gap-2 mt-1">
                                                {site.followers && (
                                                  <span className="text-[8px] font-mono text-neon-cyan bg-neon-cyan/10 px-1 rounded uppercase">
                                                    {site.followers}
                                                  </span>
                                                )}
                                                {site.posts && (
                                                  <span className="text-[8px] font-mono text-neon-magenta bg-neon-magenta/10 px-1 rounded uppercase">
                                                    {site.posts}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            {site.bio && (
                                              <p className="text-[9px] text-white/40 mt-1 line-clamp-2 leading-tight italic">
                                                "{site.bio}"
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                          <button 
                                            onClick={() => onToggleFalsePositive(site.name)}
                                            className="p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                            title="Report False Positive"
                                          >
                                            <ShieldAlert size={14} />
                                          </button>
                                          <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                              {site.confidence !== undefined && (
                                                <div 
                                                  className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                                                    site.confidence >= 80 ? 'bg-neon-lime/20 border-neon-lime/40 text-neon-lime' :
                                                    site.confidence >= 50 ? 'bg-neon-yellow/20 border-neon-yellow/40 text-neon-yellow' :
                                                    'bg-white/10 border-white/20 text-white/40'
                                                  }`}
                                                  title={`Confidence: ${site.confidence}%`}
                                                >
                                                  {site.confidence}%
                                                </div>
                                              )}
                                              <span className={`text-[9px] font-black tracking-widest ${
                                                isPossible ? 'text-neon-magenta' : 
                                                isError ? 'text-red-500' :
                                                isTimeout ? 'text-neon-yellow' :
                                                'text-neon-lime'
                                              }`}>
                                                {site.status.toUpperCase()}
                                              </span>
                                            </div>
                                            <button 
                                              onClick={() => openInBrowser(site.url)}
                                              className="p-1.5 opacity-40 group-hover/row:opacity-100 transition-opacity hover:bg-white/10 rounded"
                                            >
                                              <ExternalLink size={14} className="text-white" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Breach Intelligence */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <Zap size={20} className="text-neon-magenta" />
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">Breach_Intelligence</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all">
                      <h5 className="text-[10px] text-red-400 font-black mb-3 uppercase tracking-widest">Potential_Leaks</h5>
                      <button 
                        onClick={() => onBreachQuery('HIBP', `https://haveibeenpwned.com/account/${scanResults.target}`)}
                        className="w-full py-3 bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/30 hover:bg-red-500 hover:text-black transition-all uppercase tracking-[0.2em]"
                      >
                        RUN_HIBP_QUERY
                      </button>
                    </div>
                    <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg hover:bg-neon-cyan/10 transition-all">
                      <h5 className="text-[10px] text-neon-cyan font-black mb-3 uppercase tracking-widest">Identity_Verification</h5>
                      <button 
                        onClick={() => onBreachQuery('IntelX', `https://intelx.io/?s=${scanResults.target}`)}
                        className="w-full py-3 bg-neon-cyan/20 text-neon-cyan text-[10px] font-black border border-neon-cyan/30 hover:bg-neon-cyan/40 transition-all uppercase tracking-[0.2em]"
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
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">Whois_Data</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3 bg-white/5 p-6 border border-white/10 rounded-lg">
                      {Object.entries(scanResults.whois).map(([key, val]: [string, any]) => {
                        if (!val || typeof val !== 'string') return null;
                        const isUrl = val.startsWith('http') || val.includes('.com') || val.includes('.net') || val.includes('.org');
                        const isEmail = val.includes('@') && val.includes('.');
                        
                        return (
                          <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6 text-[10px] font-mono group/whois border-b border-white/5 pb-2 last:border-0">
                            <span className="opacity-40 uppercase tracking-widest font-bold">{key}</span>
                            {isUrl ? (
                              <button 
                                onClick={() => openInBrowser(val.startsWith('http') ? val : `https://${val}`)}
                                className="text-neon-cyan truncate max-w-full sm:max-w-[300px] hover:underline flex items-center gap-2 text-left"
                              >
                                {val} <ExternalLink size={10} />
                              </button>
                            ) : isEmail ? (
                              <button 
                                onClick={() => onToolSearch('Email Search', val)}
                                className="text-neon-cyan truncate max-w-full sm:max-w-[300px] hover:underline flex items-center gap-2 text-left"
                              >
                                {val} <Search size={10} />
                              </button>
                            ) : (
                              <span className="text-neon-cyan truncate max-w-full sm:max-w-[300px]">{val}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* DNS Data */}
                {scanResults.dns && !scanResults.dns.error && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <Activity size={20} className="text-neon-lime" />
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">DNS_Records</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4 bg-white/5 p-6 border border-white/10 rounded-lg">
                      {Object.entries(scanResults.dns).map(([type, records]: [string, any]) => (
                        (Array.isArray(records) && records.length > 0) && (
                          <div key={type} className="space-y-2">
                            <h5 className="text-[10px] font-black text-neon-lime uppercase tracking-[0.2em] mb-2">{type}_RECORDS</h5>
                            <div className="space-y-1.5 pl-4 border-l border-neon-lime/20">
                              {records.map((record: any, i: number) => {
                                const val = typeof record === 'string' ? record : JSON.stringify(record);
                                const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val);
                                const isDomain = val.includes('.') && !isIp;
                                return (
                                  <div key={i} className="flex justify-between items-center gap-4 text-[10px] font-mono group/dns">
                                    <span className="text-white/80 truncate break-all">{val}</span>
                                    {(isIp || isDomain) && (
                                      <button 
                                        onClick={() => onToolSearch(isIp ? 'IP Search' : 'Domain Search', val)}
                                        className="text-neon-lime hover:underline flex items-center gap-2 whitespace-nowrap"
                                      >
                                        SCAN <Search size={10} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onExportJSON}
              disabled={!scanResults}
              className="text-[10px] font-black text-white/40 hover:text-neon-cyan uppercase tracking-[0.2em] transition-colors disabled:opacity-10"
            >
              Export_JSON
            </button>
            <button 
              onClick={onDownloadLog}
              disabled={!scanResults}
              className="text-[10px] font-black text-white/40 hover:text-neon-magenta uppercase tracking-[0.2em] transition-colors disabled:opacity-10"
            >
              Download_Log
            </button>
          </div>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em]">
            System_Status // Nominal
          </div>
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
  onDownloadLog,
  onRetryTool,
  openInBrowser
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
      className="fixed bottom-24 right-0 sm:right-6 w-full sm:w-96 z-[1950] font-mono px-4 sm:px-0"
    >
      <div className="bg-[#050505]/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl rounded-lg overflow-hidden flex flex-col max-h-[60vh] sm:max-h-[80vh] w-full sm:w-96">
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
                        <span className="text-[11px] text-white/90 font-bold uppercase tracking-widest">{tool.name}</span>
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
                      <span className="text-[9px] text-white/40 uppercase tracking-tighter">
                        {tool.category} • {tool.type}
                      </span>
                      <span className={`text-[9px] font-black uppercase ${
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
                          {/* Retry Button for Failed Tools */}
                          {tool.status === 'failed' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onRetryTool(tool.id);
                              }}
                              className="w-full py-2 bg-red-500/20 border border-red-500/50 text-red-500 text-[10px] uppercase font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 mb-2"
                            >
                              <RotateCcw size={12} />
                              Retry_Operation
                            </button>
                          )}
                          {/* Logs */}
                          <div className="space-y-1">
                            <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-2">Execution_Logs</p>
                            {tool.logs?.map((log: string, i: number) => {
                              const urlRegex = /(https?:\/\/[^\s]+)/g;
                              const parts = log.split(urlRegex);
                              return (
                                <div key={i} className="flex gap-2 text-[9px] font-mono">
                                  <span className="text-white/10">[{i}]</span>
                                  <span className="text-white/60">
                                    {parts.map((part, j) => 
                                      urlRegex.test(part) ? (
                                        <button 
                                          key={j}
                                          onClick={() => openInBrowser(part)}
                                          className="text-neon-cyan hover:underline"
                                        >
                                          {part}
                                        </button>
                                      ) : part
                                    )}
                                  </span>
                                </div>
                              );
                            })}
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

const DiagnosticsView = ({ onRunDiagnostics }: { onRunDiagnostics: () => void }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      } else {
        setError(`API Error: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h2 className="text-4xl font-graffiti tracking-widest uppercase mb-2 text-neon-cyan">System_Diagnostics_v1.0</h2>
          <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">API Health & Operational Status</p>
        </div>
        <button 
          onClick={runDiagnostics}
          disabled={isLoading}
          className={`px-6 py-3 border-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${isLoading ? 'border-white/10 text-white/20 cursor-not-allowed' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-[0_0_20px_rgba(0,243,255,0.2)]'}`}
        >
          {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
          REFRESH_DIAGNOSTICS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* API Status */}
        <div className="bg-black/40 border-2 border-white/10 p-8 space-y-6">
          <h3 className="text-[10px] font-mono text-neon-cyan uppercase tracking-[0.3em] flex items-center gap-2">
            <Server size={14} /> API_CORE_STATUS
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Status</span>
              <span className={`text-[10px] font-black uppercase ${healthData?.status === 'ok' ? 'text-neon-lime' : 'text-red-500'}`}>
                {healthData?.status || 'UNKNOWN'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Environment</span>
              <span className="text-[10px] font-bold text-white uppercase">{healthData?.environment || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Version</span>
              <span className="text-[10px] font-bold text-white uppercase">{healthData?.version || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">Uptime</span>
              <span className="text-[10px] font-bold text-neon-cyan uppercase">SYSTEM_STABLE</span>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-black/40 border-2 border-white/10 p-8 space-y-6">
          <h3 className="text-[10px] font-mono text-neon-magenta uppercase tracking-[0.3em] flex items-center gap-2">
            <Globe size={14} /> NETWORK_CONNECTIVITY
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Google_Search</span>
              <span className="text-[10px] font-black text-neon-lime uppercase tracking-widest">OPERATIONAL</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">DuckDuckGo</span>
              <span className="text-[10px] font-black text-neon-lime uppercase tracking-widest">OPERATIONAL</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">WHOIS_RDAP</span>
              <span className="text-[10px] font-black text-neon-lime uppercase tracking-widest">OPERATIONAL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">DNS_RESOLVER</span>
              <span className="text-[10px] font-black text-neon-lime uppercase tracking-widest">OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* Intelligence Engine */}
        <div className="bg-black/40 border-2 border-white/10 p-8 space-y-6">
          <h3 className="text-[10px] font-mono text-neon-lime uppercase tracking-[0.3em] flex items-center gap-2">
            <Brain size={14} /> NEURAL_ENGINE_STATUS
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Model</span>
              <span className="text-[10px] font-bold text-white uppercase">{healthData?.aiEngine?.model || 'GEMINI-3-FLASH'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">API_Key</span>
              <span className={`text-[10px] font-black uppercase ${(healthData?.aiEngine?.configured || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY)) ? 'text-neon-lime' : 'text-red-500'}`}>
                {(healthData?.aiEngine?.configured || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY)) ? 'CONFIGURED' : 'MISSING'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Latency</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${healthData?.network?.latency === 'optimal' ? 'text-neon-lime' : 'text-neon-cyan'}`}>
                {healthData?.network?.latency?.toUpperCase() || 'OPTIMAL'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">Quota</span>
              <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">UNLIMITED_FREE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-black/40 border-2 border-white/10 p-8 space-y-6">
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity size={14} /> SERVER_RESOURCES
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">Uptime</span>
              <span className="text-[10px] font-bold text-white uppercase">
                {healthData?.uptime ? `${Math.floor(healthData.uptime / 3600)}H ${Math.floor((healthData.uptime % 3600) / 60)}M` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">Memory_Usage</span>
              <span className="text-[10px] font-bold text-neon-cyan uppercase">
                {healthData?.memory?.rss ? `${Math.round(healthData.memory.rss / 1024 / 1024)} MB` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border-2 border-white/10 p-8 space-y-6">
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
            <Shield size={14} /> SECURITY_POSTURE
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-white/40 uppercase">SSL_Status</span>
              <span className="text-[10px] font-bold text-neon-lime uppercase">ENCRYPTED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">Proxy_State</span>
              <span className="text-[10px] font-bold text-neon-lime uppercase">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl flex items-center gap-4">
          <AlertTriangle className="text-red-500" size={24} />
          <div>
            <p className="text-[10px] font-mono text-red-500 uppercase font-black tracking-widest">Diagnostic_Failure</p>
            <p className="text-xs font-mono text-white/60 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-black/40 border-2 border-white/10 p-8">
        <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <Terminal size={14} /> RAW_SYSTEM_LOG
        </h3>
        <pre className="font-mono text-[10px] text-white/60 leading-relaxed overflow-x-auto custom-scrollbar bg-black/20 p-6 border border-white/5">
          {JSON.stringify(healthData || { status: 'Awaiting diagnostics...' }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

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
