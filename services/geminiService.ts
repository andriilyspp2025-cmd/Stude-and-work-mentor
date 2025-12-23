import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { MENTOR_PERSONA } from '../constants';
import { UserProfile, HistoryItem, Message, SearchResultJSON } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_FAST = 'gemini-3-flash-preview';
// Using PRO for deep reasoning in interviews/architecture
const MODEL_SMART = 'gemini-3-pro-preview'; 

// --- ONBOARDING SERVICES ---

export const createOnboardingChat = (): Chat => {
  return ai.chats.create({
    model: MODEL_FAST,
    config: {
      systemInstruction: `
      You are an IT Recruiter and Career Mentor.
      Your goal is to conduct a BRIEF (3-5 questions) intake interview with a new user to understand their level.
      
      TONE: Friendly, professional, curious. Ukrainian language.
      
      GOALS:
      1. Find out their main tech stack (e.g., Frontend React, Java Backend, QA).
      2. Determine their current level (Student, Trainee, Switcher, Junior).
      3. Identify their main career goal (Getting first job, internship, promotion).
      
      Start by asking about their main technology of interest.
      `,
    },
  });
};

export const summarizeUserProfile = async (
  baseData: { name: string, email: string, github: string, linkedin: string, cv: string },
  chatHistory: string
): Promise<string> => {
  try {
    const sanitizedCV = baseData.cv.length > 50000 ? baseData.cv.substring(0, 50000) + "...[TRUNCATED]" : baseData.cv;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `
      Based on the static data and chat history, create a concise Technical User Profile Summary (150 words max).
      
      Static Data:
      Name: ${baseData.name}
      Email: ${baseData.email}
      GitHub: ${baseData.github}
      LinkedIn: ${baseData.linkedin}
      CV Content (Snippet): ${sanitizedCV}
      
      Chat History:
      ${chatHistory}
      
      OUTPUT FORMAT:
      Role: [Target Role]
      Level: [Estimated Level]
      Stack: [Key Technologies]
      Goals: [Main Career Goal]
      Summary: [Short bio focusing on strengths and gaps]
      `,
    });
    return response.text || "Junior Developer Profile";
  } catch (error) {
    console.error("Summary error", error);
    return "Standard Junior Profile";
  }
};

// --- CORE SERVICES ---

export const analyzeCodeOrProfile = async (input: string, userProfile?: UserProfile): Promise<string> => {
  const context = userProfile ? `USER CONTEXT: ${userProfile.bioSummary}\nGitHub: ${userProfile.githubUrl}` : '';
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART, 
      contents: `${context}\n\nUSER INPUT TO ANALYZE: ${input}`,
      config: {
        systemInstruction: `${MENTOR_PERSONA}
        PHASE 1: THE SCANNER.
        Analyze the input considering the User Context.
        - If input is code: Perform architectural review.
        - If input is text/profile: Compare against Ukrainian market needs.
        `,
        temperature: 0.4,
      }
    });
    return response.text || "Не вдалося отримати аналіз.";
  } catch (error) {
    console.error("Gemini Scanner Error:", error);
    return "Помилка аналізу.";
  }
};

export const generateProjectIdeas = async (input: string, userProfile?: UserProfile): Promise<string> => {
  const context = userProfile ? `USER CONTEXT: ${userProfile.bioSummary}` : '';
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `${context}\n\nUSER REQUEST: ${input}`,
      config: {
        systemInstruction: `${MENTOR_PERSONA}
        PHASE 2: THE ARCHITECT (Project Mode).
        Design a "Portfolio-Killer" project tailored to the user's level and stack.
        `,
        temperature: 0.7,
      }
    });
    return response.text || "Не вдалося згенерувати ідею.";
  } catch (error) {
    console.error("Gemini Architect Error:", error);
    return "Помилка генерації.";
  }
};

export const generateLearningRoadmap = async (input: string, userProfile?: UserProfile): Promise<string> => {
  const context = userProfile ? `USER CONTEXT: ${userProfile.bioSummary}` : '';

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `${context}\n\nUSER REQUEST: ${input}`,
      config: {
        systemInstruction: `${MENTOR_PERSONA}
        PHASE 2: THE ARCHITECT (Roadmap Mode).
        Create a detailed Career Roadmap.
        - **MANDATORY**: Include specific, clickable links to FREE resources.
        - Tailor the complexity to the User Context.
        `,
        temperature: 0.5,
      }
    });
    return response.text || "Не вдалося створити план.";
  } catch (error) {
    console.error("Roadmap Error:", error);
    return "Помилка створення плану.";
  }
};

export const findOpportunities = async (query: string, userProfile?: UserProfile): Promise<{ data: SearchResultJSON, sources: any[] }> => {
  const actualQuery = query || (userProfile ? `Junior positions for ${userProfile.bioSummary}` : "Junior IT jobs Ukraine");

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `
      Role: Professional IT Recruiter.
      Task: Find REAL, ACTIVE job opportunities for: "${actualQuery}".
      
      CONSTRAINTS:
      1. **RELEVANCE**: Only include jobs posted within the LAST 14 DAYS.
      2. **LOCATION**: Focus on Ukraine (Kyiv, Lviv, Remote).
      3. **VALIDITY**: Do NOT invent job IDs.
      
      CRITICAL URL STRATEGY (Avoid 404s):
      - If you find a direct, verifiable link in the search results (e.g., specific djinni.co/jobs/12345), use it.
      - **IF NOT**, you MUST construct a "Smart Search URL" that leads to a filtered list.
        Examples:
        - Djinni: "https://djinni.co/jobs/?primary_keyword=Python&exp_level=no_exp" (Adjust for tech)
        - DOU: "https://jobs.dou.ua/vacancies/?category=Java&exp=0-1"
        - Robota: "https://robota.ua/zapros/junior-frontend-developer"
      
      OUTPUT JSON STRUCTURE:
      {
        "summary": "Market analysis summary (e.g. 'Found 5 relevant vacancies posted this week').",
        "vacancies": [
          {
            "id": "generate-random-uuid",
            "company": "Company Name",
            "title": "Job Title",
            "location": "City / Remote",
            "tags": ["Tech1", "Tech2"],
            "descriptionSnippet": "Brief summary",
            "source": "Djinni/DOU/LinkedIn",
            "url": "THE_SMART_URL", 
            "datePosted": "e.g. '2 дні тому' or 'Сьогодні'"
          }
        ],
        "internships": []
      }
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction: `${MENTOR_PERSONA}
        PHASE 4: AGENT. 
        You are strictly forbidden from creating broken links. 
        If unsure about a specific link, give a Search Page link.
        `,
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const jsonText = response.text || "{}";
    let data: SearchResultJSON;
    
    try {
        data = JSON.parse(jsonText);
        
        // Post-processing to enforce URL safety fallback on client side if AI fails
        data.vacancies = data.vacancies.map(v => {
            // Heuristic: If URL looks suspicious (too short or just base domain), replace with search
            if (!v.url || v.url.length < 15 || !v.url.includes('http')) {
                const q = encodeURIComponent(`${v.title} ${v.company}`);
                v.url = `https://www.google.com/search?q=${q}+site:djinni.co+OR+site:jobs.dou.ua`;
            }
            return v;
        });

    } catch (e) {
        console.error("Failed to parse JSON", e);
        data = { summary: "Error parsing results", vacancies: [], internships: [] };
    }
    
    return {
      data: data,
      sources: groundingChunks
    };
  } catch (error) {
    console.error("Search Error:", error);
    return { 
        data: { summary: "Помилка пошуку", vacancies: [], internships: [] }, 
        sources: [] 
    };
  }
};

export const analyzeJobAndCoverLetter = async (jobDesc: string, userProfile?: UserProfile): Promise<string> => {
  const context = userProfile 
    ? `USER PROFILE: ${userProfile.bioSummary}\nGithub: ${userProfile.githubUrl}\nLinkedIn: ${userProfile.linkedinUrl}\nCV Info: ${userProfile.cvText}` 
    : "Standard Junior Profile";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `User Context: ${context}\n\nJob Description: ${jobDesc}`,
      config: {
        systemInstruction: `${MENTOR_PERSONA}
        PHASE 4: THE CAREER AGENT (Cover Letter Mode).
        - Rank match score.
        - Write a Cover Letter connecting specific USER PROFILE details to the JOB DESCRIPTION.
        `,
        temperature: 0.5,
      }
    });
    return response.text || "Не вдалося проаналізувати вакансію.";
  } catch (error) {
    console.error("Gemini Agent Error:", error);
    return "Помилка аналізу вакансії.";
  }
};

export const createInterviewChat = (
  history: Message[], 
  contextData?: { lastArchitecture?: HistoryItem, lastScan?: HistoryItem }
): Chat => {
  
  // Prepare dynamic context about what the user has done in other tabs
  let extraContext = "";
  if (contextData?.lastArchitecture) {
    extraContext += `\n[CONTEXT: User recently generated a ${contextData.lastArchitecture.type} titled "${contextData.lastArchitecture.title}". You can reference this if they ask.]`;
  }
  if (contextData?.lastScan) {
    extraContext += `\n[CONTEXT: User recently scanned code/skills. Result summary: "${contextData.lastScan.title}".]`;
  }

  // Convert Message[] to proper Content format for history
  const historyContent: Content[] = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }]
  }));

  return ai.chats.create({
    model: MODEL_SMART,
    history: historyContent,
    config: {
      systemInstruction: `${MENTOR_PERSONA}
      PHASE 3: THE MENTOR.
      Conduct a strict interview.
      ${extraContext}
      `,
    },
  });
};