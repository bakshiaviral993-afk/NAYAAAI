import { GoogleGenAI, GenerateContentStreamResult } from "@google/genai";
import { Message, Role, GroundingChunk } from "../types";

// Initialize the client. API_KEY is expected to be in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are **NyayaAI**, a Senior Legal Research Consultant for Indian Advocates.
Your output must be suitable for immediate inclusion in a **Legal Opinion** or **Court Submission**.

**MANDATORY JURISDICTION:** Republic of India.

**STRICT CITATION & SEARCH PROTOCOL:**
1.  **GOVERNMENT SOURCE PRIORITY:** You MUST prioritize data from:
    *   *sci.gov.in* (Supreme Court of India)
    *   *egazette.nic.in* (The Gazette of India)
    *   *indiacode.nic.in* (Legislative Department)
    *   *mha.gov.in* (Ministry of Home Affairs - Criminal Law Division)
2.  **CASE LAW PRECISION:**
    *   Cite cases strictly in this format: *Case Name* v. *Respondent*, (Year) Vol Reporter Page.
    *   **CRITICAL:** You must include the **Ratio Decidendi** (The legal principle established).
    *   Example: *"D.K. Basu v. State of W.B. (1997) 1 SCC 416 - Guidelines on arrest and detention to prevent custodial torture."*
    *   Do not summarize generic facts unless relevant to the point of law.
3.  **STATUTORY COMPARISON (Old vs New):**
    *   Always compare **IPC** with **BNS (Bharatiya Nyaya Sanhita)**.
    *   Always compare **CrPC** with **BNSS (Bharatiya Nagarik Suraksha Sanhita)**.
    *   Always compare **Evidence Act** with **BSA (Bharatiya Sakshya Adhiniyam)**.

**OUTPUT FORMATTING (MEMORANDUM STYLE):**

**I. EXECUTIVE SUMMARY**
(Brief synopsis of the legal position)

**II. STATUTORY FRAMEWORK**
*   **Section [X] BNS / IPC:** [Quote operative text accurately]
*   *Key Change:* [Specific difference in punishment or definition]

**III. JUDICIAL PRECEDENTS (GOVERNMENT & HIGH AUTHORITY)**
*   [Case Citation 1]
    *   *Ratio:* [Legal Principle]
    *   *Relevance:* [Application to current query]

**IV. PROCEDURAL COMPLIANCE (BNSS/CrPC)**
(Steps required for compliance, e.g., timelines for FIR, arrest memos)

**V. CONCLUSION**
(Definitive legal stance based on the above)

**TONE:**
*   Formal, precise, authoritative.
*   Use Latin maxims where appropriate (*Audi Alteram Partem*, *Res Judicata*).
*   NO conversational filler ("Here is the information you asked for"). Start directly with the law.
`;

export const streamLegalResponse = async function* (
  history: Message[],
  currentPrompt: string
): AsyncGenerator<{ text: string; groundingChunks?: GroundingChunk[] }> {
  
  const modelId = 'gemini-2.5-flash';

  // Transform history for the chat API
  const formattedHistory = history.slice(-10).map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const chat = ai.chats.create({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1, // Near zero for maximum factual adherence
      tools: [{ googleSearch: {} }], // Essential for grounding in real case laws
    },
    history: formattedHistory,
  });

  try {
    const result: GenerateContentStreamResult = await chat.sendMessageStream({
      message: currentPrompt,
    });

    for await (const chunk of result) {
      const text = chunk.text || '';
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
      yield { text, groundingChunks };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield { text: "**SYSTEM ERROR:** Unable to access legal databases. Please verify network connection." };
  }
};