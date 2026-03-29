export type OSINTCategory = 
  | 'Search Engines' 
  | 'Social Media' 
  | 'Domain & IP' 
  | 'Email & Username' 
  | 'Images & Video' 
  | 'Maps & Geolocation' 
  | 'Dark Web' 
  | 'Breach & History'
  | 'Frameworks & Suites'
  | 'Gaming'
  | 'Financial'
  | 'Dating'
  | 'NSFW'
  | 'Chat & VoIP';

export interface OSINTTool {
  id: string;
  name: string;
  description: string;
  url: string;
  searchUrl?: string; // Template like "https://example.com/search?q={query}"
  howToUse?: string;
  combinations?: string[]; // IDs or names of tools that work well with this one
  category: OSINTCategory;
  tags: string[];
  faviconUrl?: string;
  isFree: boolean;
  aiReason?: string; // Added for AI-driven recommendations
  aiDirectLink?: string; // Added for direct tool access from AI
}

export interface ToolGroup {
  id: string;
  name: string;
  description: string;
  toolIds: string[];
  suggestedSequence: string[]; // Names of tools in order
}
