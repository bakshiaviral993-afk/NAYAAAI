import { GoogleGenAI, GenerateContentStreamResult, GenerateContentResponse } from "@google/genai";
import { Message, Role, GroundingChunk, MockQuestion } from "../types";

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

export const generateExamPaper = async (examName: string, onProgress?: (length: number) => void): Promise<string> => {
    try {
        const isSubjective = examName.toLowerCase().includes('qualifying');
        
        let prompt = '';

        if (isSubjective) {
            // Prompt for BCI Qualifying Exams (Subjective Format) - FULL LENGTH WITH ANSWERS
            prompt = `
                You are a senior Legal Academician. Retrieve and reconstruct the **FULL-LENGTH** question paper for: **${examName}**.
                
                **OBJECTIVE:**
                Create a comprehensive study document (approx 15-20 pages equivalent) containing the questions AND detailed model answers.

                **SEARCH STRATEGY:**
                1. Search "Bar Council of India ${examName} question paper".
                2. Search "BCI Foreign Law Degree exam previous papers".
                3. Retrieve the actual questions for Part A, Part B, and Part C.
                
                **OUTPUT FORMAT (SUBJECTIVE - WITH ANSWERS):**
                Start with: "BAR COUNCIL OF INDIA QUALIFYING EXAMINATION - ${examName} (FULL PAPER WITH SOLUTIONS)"
                
                **PART - A (Short Notes)**
                *Instructions: Answer any FIVE. (5 x 5 = 25 Marks)*
                
                **Q1:** [Question Text]
                **Model Answer Synopsis:** [Provide a detailed 150-word legal note citing relevant sections/cases]
                
                **Q2:** [Question Text]
                **Model Answer Synopsis:** [Provide a detailed 150-word legal note]
                
                ... (Continue for all Part A questions found)

                **PART - B (Essay/Analysis)**
                *Instructions: Answer any THREE. (3 x 15 = 45 Marks)*
                
                **Q7:** [Question Text]
                **Comprehensive Model Answer:** [Provide a detailed 400-word essay structure. Include Introduction, Body Paragraphs with Case Laws, and Conclusion.]
                
                ... (Continue for all Part B questions found)
                
                **PART - C (Problem Solving)**
                *Instructions: Answer any ONE. (1 x 30 = 30 Marks)*
                
                **Q11:** [Question Text]
                **Legal Opinion & Solution:** [Provide a full legal opinion. Issue, Rule, Analysis, Conclusion. Cite Case Laws.]

                **CONSTRAINT:**
                Do not summarize. Expand on the legal reasoning to ensure the document is substantial and useful for study.
            `;
        } else {
            // Prompt for AIBE (Objective Format) - FULL 100 QUESTIONS WITH SUBJECT WEIGHTAGE
            prompt = `
                You are a senior Legal Archivist. Reconstruct the **COMPLETE** All India Bar Examination (AIBE) paper for: **${examName}**.
                
                **MANDATORY INSTRUCTION:**
                You MUST generate the questions following the official Bar Council of India subject weightage strictly. Do not stop until you have generated the full set.
                
                **STRUCTURE TO FOLLOW (100 Questions):**
                1.  **Constitutional Law:** 10 Questions
                2.  **IPC (Indian Penal Code):** 8 Questions
                3.  **CrPC (Criminal Procedure):** 10 Questions
                4.  **CPC (Civil Procedure):** 10 Questions
                5.  **Evidence Act:** 8 Questions
                6.  **Alternative Dispute Resolution:** 4 Questions
                7.  **Family Law:** 8 Questions
                8.  **Public Interest Litigation:** 4 Questions
                9.  **Administrative Law:** 3 Questions
                10. **Professional Ethics:** 4 Questions
                11. **Company Law:** 2 Questions
                12. **Environmental Law:** 2 Questions
                13. **Cyber Law:** 2 Questions
                14. **Labour & Industrial Laws:** 4 Questions
                15. **Tort & Consumer Protection:** 5 Questions
                16. **Taxation:** 4 Questions
                17. **Contract Law:** 8 Questions
                18. **Land Acquisition:** 2 Questions
                19. **Intellectual Property:** 2 Questions

                **SEARCH STRATEGY:**
                1. Search "AIBE [Year] full question paper text".
                2. Search "AIBE [Year] answer key with solutions".
                3. Compile data from sources like LawMint, LiveLaw, BarAndBench, Aglasem.
                
                **OUTPUT FORMAT (OBJECTIVE):**
                Start with "ALL INDIA BAR EXAMINATION - ${examName} (COMPLETE ARCHIVE)".
                
                Format each question strictly as:
                
                **Question [N]:** [Question Text]
                **Options:**
                (A) [Text]
                (B) [Text]
                (C) [Text]
                (D) [Text]
                **Correct Answer:** [Option]
                **Detailed Legal Reasoning:** [This is MANDATORY. Write a paragraph explaining WHY the answer is correct. Cite the specific Section of IPC/CrPC/CPC/Evidence Act or the Supreme Court Case Law that governs this answer.]

                **CONSTRAINT:** 
                - If exact historical questions for a specific slot are unavailable, synthesize high-probability questions based on previous years trends for that specific subject slot.
                - The "Legal Reasoning" section must be detailed to add value and length to the document.
            `;
        }

        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
                maxOutputTokens: 8192, // Maximum allowed tokens
                tools: [{ googleSearch: {} }]
            }
        });

        let fullText = '';
        for await (const chunk of result) {
            const text = chunk.text || '';
            fullText += text;
            if (onProgress) {
                onProgress(fullText.length);
            }
        }

        if (!fullText) return "AI_ERROR: Empty response from legal database.";
        return fullText;

    } catch (error) {
        console.error("Exam Generation Error:", error);
        return "AI_ERROR: Could not retrieve exam data. Please check network.";
    }
};

export const generateMockTestQuestions = async (): Promise<MockQuestion[]> => {
    try {
        const prompt = `
            Generate a **Mock Test for the All India Bar Examination (AIBE)**.
            Create 10 challenging multiple-choice questions covering: 
            - Constitutional Law
            - IPC / BNS
            - CrPC / BNSS
            - Evidence Act / BSA
            - Professional Ethics
            
            **OUTPUT FORMAT:**
            Return ONLY valid JSON. The structure must be:
            [
                {
                    "id": 1,
                    "question": "Question Text",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswerIndex": 0,
                    "rationale": "Brief explanation of why A is correct citing section/case.",
                    "subject": "Constitutional Law"
                }
            ]
        `;

        const result: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.4,
                responseMimeType: "application/json"
            }
        });

        const jsonText = result.text || "[]";
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Mock Test Generation Error:", error);
        return [];
    }
};