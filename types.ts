export enum AppMode {
  SCANNER = 'SCANNER',
  ARCHITECT = 'ARCHITECT',
  MENTOR = 'MENTOR',
  AGENT = 'AGENT',
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface UserIntegrations {
  notion: boolean;
  obsidian: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  cvText: string;
  bioSummary: string; // AI generated summary of skills and goals
  isOnboarded: boolean;
  integrations: UserIntegrations;
}

export interface Vacancy {
  id: string; // Unique ID for saving/hiding
  company: string;
  title: string;
  location: string;
  salary?: string;
  tags: string[];
  descriptionSnippet: string;
  source: string; // Djinni, DOU, etc
  url: string;
  datePosted: string; // e.g., "1 день тому"
  viewsCount?: number;
}

export interface SearchResultJSON {
  summary: string;
  vacancies: Vacancy[];
  internships: Vacancy[];
}

export interface HistoryItem {
  id: string;
  type: 'scanner' | 'roadmap' | 'project' | 'search' | 'cover_letter';
  title: string; // Short summary for the sidebar
  content: string | SearchResultJSON; // Can be string or JSON object
  timestamp: number;
  metadata?: any; // Extra data like sources for search
}

export interface AppState {
  scannerHistory: HistoryItem[];
  architectHistory: HistoryItem[];
  agentHistory: HistoryItem[];
  mentorMessages: Message[];
}

export interface SkillGapAnalysis {
  technicalLevel: string;
  missingSkills: string[];
  recommendations: string[];
  marketAlignment: string; // How well they fit typical Ukrainian Junior profiles
}

export interface ProjectSuggestion {
  title: string;
  description: string;
  technologies: string[];
  businessGoal: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';