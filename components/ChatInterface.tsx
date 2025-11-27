import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Message, Role, GroundingChunk } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { streamLegalResponse } from '../services/geminiService';
import { jsPDF } from "jspdf";

export interface ChatInterfaceHandle {
  getMessages: () => Message[];
  loadMessages: (msgs: Message[]) => void;
  resetChat: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, {}>((props, ref) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const INITIAL_MESSAGE: Message = {
      id: 'welcome',
      role: Role.MODEL,
      text: "### Legal Research Counsel\n\n**TO:** Advocate\n**FROM:** NyayaAI System\n**SUBJECT:** Legal Research Initialization\n\nI am connected to Indian Statutory and Judicial databases. I can assist with:\n\n*   **Comparative Analysis:** IPC vs. BNS, CrPC vs. BNSS.\n*   **Case Law Retrieval:** Supreme Court & High Court Judgments.\n*   **Procedural Compliance:** Drafting & Limitation Periods.\n\nPlease dictate or type your query.",
      timestamp: Date.now()
  };

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  
  // PDF Generation State
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Copy State
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getMessages: () => messages,
    loadMessages: (msgs: Message[]) => {
      setMessages(msgs);
      // Wait for state update then scroll
      setTimeout(scrollToBottom, 100);
    },
    resetChat: () => {
      setMessages([INITIAL_MESSAGE]);
      setInput('');
    }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-IN'; // Set to Indian English for better legal term recognition

        recognitionRef.current.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript;
                    setInput(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + transcript);
                }
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser environment.");
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.error("Failed to start recognition:", e);
        }
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => console.error("Failed to copy:", err));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessagePlaceholder: Message = {
      id: modelMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setMessages(prev => [...prev, modelMessagePlaceholder]);

    try {
      const stream = streamLegalResponse(messages, userMessage.text);
      let fullText = '';
      let chunks = undefined;

      for await (const chunk of stream) {
        fullText += chunk.text;
        if (chunk.groundingChunks) {
            if (!chunks) chunks = chunk.groundingChunks;
            else chunks = [...chunks, ...chunk.groundingChunks];
        }

        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMessageId 
              ? { ...msg, text: fullText, groundingChunks: chunks } 
              : msg
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === modelMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // PDF Generation Function
  const handleDownloadPDF = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    setPdfProgress(5);

    // Yield to allow UI update
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;
        
        let currentPage = 1;
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // Function to add Header and Footer to a page
        const addHeaderFooter = (pageNo: number) => {
           // Header
           doc.setFont("times", "bold");
           doc.setFontSize(10);
           doc.setTextColor(60, 60, 60); // Charcoal
           doc.text("NYAYA AI - INDIAN LEGAL INTELLIGENCE", pageWidth / 2, 15, { align: "center" });
           
           doc.setDrawColor(200, 200, 200);
           doc.setLineWidth(0.5);
           doc.line(margin, 18, pageWidth - margin, 18);

           // Footer
           doc.setFont("times", "normal");
           doc.setFontSize(8);
           doc.setTextColor(128, 128, 128); // Grey
           doc.text(`Generated: ${dateStr} | ${timeStr}`, margin, pageHeight - 10);
           doc.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 10, { align: "right" });
        };

        // Initialize first page
        addHeaderFooter(currentPage);
        let yPosition = 30;

        // Document Title
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("LEGAL RESEARCH MEMORANDUM", margin, yPosition);
        yPosition += 10;
        
        // Line under title
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
        yPosition += 10;

        // Filter messages to export (exclude welcome)
        const exportMessages = messages.filter(m => m.id !== 'welcome');
        const totalItems = exportMessages.length;

        for (let i = 0; i < totalItems; i++) {
            const msg = exportMessages[i];
            
            // Text Cleaning
            let cleanText = msg.text
                .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
                .replace(/\*(.*?)\*/g, '$1')     // Italic
                .replace(/###\s?/g, '')          // Heading
                .replace(/##\s?/g, '')           // Heading
                .replace(/^>\s?/gm, '   ')     // Blockquotes indentation
                .replace(/`/g, '')               // Code
                .trim();
            
            // Convert bullets
            cleanText = cleanText.replace(/^\s*[\-\*]\s/gm, '•  ');

            const splitText = doc.splitTextToSize(cleanText, maxLineWidth);
            const textHeight = splitText.length * 5; // approx 5 units per line
            const headerHeight = 7;
            const spacing = 10;
            
            // Calculate height for sources if they exist
            let sourcesHeight = 0;
            const uniqueSources: GroundingChunk[] = msg.groundingChunks 
                ? Array.from(new Map<string | undefined, GroundingChunk>(
                    msg.groundingChunks.map((c: GroundingChunk) => [c.web?.uri, c])
                  ).values()).filter((c: GroundingChunk) => c.web?.uri)
                : [];
            
            if (uniqueSources.length > 0) {
                sourcesHeight = 10 + (uniqueSources.length * 5); // Header + lines
            }

            const totalBlockHeight = textHeight + headerHeight + spacing + sourcesHeight;

            // Check if we need a new page
            if (yPosition + totalBlockHeight > pageHeight - 20) {
                doc.addPage();
                currentPage++;
                addHeaderFooter(currentPage);
                yPosition = 30;
            }

            // Section Label
            const isUser = msg.role === Role.USER;
            doc.setFont("times", "bold");
            doc.setFontSize(10);
            doc.setTextColor(isUser ? 100 : 0); // User Grey, System Black
            const label = isUser ? "QUERY:" : "OPINION:";
            doc.text(label, margin, yPosition);
            yPosition += 5;

            // Body Text
            doc.setFont("times", "normal");
            doc.setFontSize(11);
            doc.setTextColor(20, 20, 20);
            doc.text(splitText, margin, yPosition);
            yPosition += textHeight;

            // Add Grounding Sources if available
            if (uniqueSources.length > 0 && !isUser) {
                yPosition += 5;
                doc.setFont("times", "bold");
                doc.setFontSize(9);
                doc.setTextColor(180, 83, 9); // Amber-ish
                doc.text("Evidentiary Sources:", margin, yPosition);
                yPosition += 4;
                
                doc.setFont("times", "normal");
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);

                uniqueSources.forEach((source: GroundingChunk) => {
                    if (source.web?.uri) {
                        const title = source.web.title || new URL(source.web.uri).hostname;
                        const line = `• ${title} (${source.web.uri})`;
                        doc.text(line, margin + 5, yPosition);
                        yPosition += 5;
                    }
                });
            }

            yPosition += spacing;

            // Separator after Opinion
            if (!isUser) {
                 doc.setDrawColor(220, 220, 220);
                 doc.setLineWidth(0.2);
                 doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            }

            // Update Progress
            const progress = Math.round(((i + 1) / totalItems) * 100);
            setPdfProgress(progress);
            
            // Yield to main thread to allow UI render
            if (i % 2 === 0) await new Promise(resolve => setTimeout(resolve, 10));
        }

        const fileName = `NyayaAI_Memorandum_${today.toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);

    } catch (e) {
        console.error("PDF Export Error:", e);
        alert("Failed to export PDF. Please check console for details.");
    } finally {
        setIsPdfGenerating(false);
        setPdfProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1115] relative font-serif">
      {/* PDF Generation Progress Overlay */}
      {isPdfGenerating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 p-8 rounded-lg border border-slate-700 shadow-2xl max-w-sm w-full flex flex-col items-center">
                <div className="w-12 h-12 mb-4 text-amber-500 animate-bounce">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-200 serif mb-2">Exporting Brief</h3>
                <p className="text-slate-400 text-sm mb-6">Compiling legal memorandum and sources...</p>
                
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div 
                        className="bg-amber-600 h-full transition-all duration-300 ease-out" 
                        style={{ width: `${pdfProgress}%` }}
                    ></div>
                </div>
                <span className="text-amber-500 font-mono text-xs">{pdfProgress}% Complete</span>
            </div>
        </div>
      )}

      {/* Header for Chat Area */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0f1115]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <h2 className="text-slate-400 font-serif text-xs tracking-[0.2em] uppercase">Secure Legal Channel</h2>
        </div>
        <button 
            onClick={handleDownloadPDF}
            disabled={isPdfGenerating}
            className={`flex items-center gap-2 bg-amber-900/10 hover:bg-amber-900/20 text-amber-600 hover:text-amber-500 px-4 py-2 rounded border border-amber-900/30 transition-all text-xs tracking-wider uppercase ${isPdfGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Brief (PDF)
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide bg-[#0f1115]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[95%] md:max-w-[85%] ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded border flex items-center justify-center ${msg.role === Role.USER ? 'bg-slate-800 border-slate-700' : 'bg-amber-950/20 border-amber-900/30'}`}>
                {msg.role === Role.USER ? (
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                ) : (
                  <span className="text-xl leading-none text-amber-600 font-serif">§</span>
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${msg.role === Role.USER ? 'items-end' : 'items-start'} w-full`}>
                <div 
                    className={`relative group px-8 py-6 shadow-sm text-base md:text-lg leading-relaxed w-full font-serif ${
                    msg.role === Role.USER 
                        ? 'bg-[#1a1d24] text-slate-300 border border-slate-800 rounded-lg rounded-tr-none' 
                        : 'bg-transparent text-slate-200 border-l-4 border-amber-800 pl-6'
                    }`}
                >
                  {msg.role === Role.MODEL && !msg.isStreaming && (
                    <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="absolute top-2 right-2 p-2 text-slate-500 hover:text-amber-500 bg-[#0f1115] border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm z-10"
                        title="Copy to clipboard"
                    >
                        {copiedMessageId === msg.id ? (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                    </button>
                  )}

                  {msg.role === Role.MODEL && !msg.text && msg.isStreaming ? (
                    <div className="flex space-x-2 h-6 items-center">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse delay-200"></div>
                    </div>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}
                </div>

                {/* Grounding Sources - Display specific government websites */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-4 text-xs text-slate-500 bg-[#13151a] p-4 rounded border border-slate-800/50 w-full ml-0 md:ml-6 max-w-2xl">
                        <div className="flex items-center gap-2 mb-2">
                             <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
                             <span className="font-bold text-amber-700/80 uppercase tracking-widest text-[10px]">Evidentiary Authorities & Sources:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* Deduplicate chunks by URI before rendering */}
                            {Array.from(new Map<string | undefined, GroundingChunk>(
                                msg.groundingChunks.map((c: GroundingChunk) => [c.web?.uri, c])
                            ).values()).map((chunk: GroundingChunk, idx) => {
                                if (!chunk.web?.uri) return null;
                                
                                // Check for Official Government Domains
                                const isGov = chunk.web.uri.includes('.gov.in') || chunk.web.uri.includes('.nic.in');
                                const isKanoon = chunk.web.uri.includes('indiankanoon.org');

                                return (
                                    <a 
                                        key={idx} 
                                        href={chunk.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`
                                            flex items-center gap-2 px-3 py-2 rounded border transition-all duration-300 group
                                            ${isGov 
                                                ? 'bg-amber-950/20 border-amber-900/50 text-amber-500 hover:bg-amber-900/30 shadow-[0_0_10px_rgba(180,83,9,0.1)]' 
                                                : isKanoon
                                                    ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                                                    : 'bg-[#1a1d24] border-slate-800 text-slate-400 hover:border-slate-600'
                                            }
                                        `}
                                    >
                                        {isGov ? (
                                            <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 19h20L12 2zm0 3l6 11H6l6-11zm-1 11h2v2h-2v-2zm0-7h2v5h-2V9z"/></svg> 
                                        ) : (
                                            <svg className="w-3 h-3 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[200px] font-serif text-[11px] font-medium leading-none mb-0.5">
                                                {chunk.web.title || new URL(chunk.web.uri).hostname.replace('www.', '')}
                                            </span>
                                            {isGov && <span className="text-[9px] text-amber-700 uppercase tracking-wider font-bold">Official Record</span>}
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                )}
                
                {/* Timestamp */}
                {msg.role === Role.USER && (
                    <span className="text-[10px] text-slate-700 mt-2 font-sans uppercase tracking-widest mr-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 bg-[#0f1115] border-t border-slate-900 z-10">
        <div className="max-w-5xl mx-auto relative flex items-end gap-3 bg-[#16181d] p-4 rounded-lg border border-slate-800 focus-within:border-amber-800/50 transition-all shadow-2xl">
            
            {/* Voice Input Button */}
            <button
                onClick={toggleVoiceInput}
                className={`p-3 rounded-full mb-0.5 transition-all duration-200 ${
                    isListening 
                    ? 'bg-red-900/20 text-red-500 animate-pulse border border-red-900/50' 
                    : 'text-slate-500 hover:text-amber-600 hover:bg-slate-800'
                }`}
                title="Dictate Query (Indian English)"
            >
                {isListening ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
            </button>

            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening to counsel..." : "Dictate or type case law, citation, or procedural query..."}
                className="w-full bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-600 resize-none max-h-48 min-h-[50px] py-3 px-2 text-lg font-serif"
                rows={1}
                style={{ height: 'auto', minHeight: '50px' }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                }}
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-full mb-0.5 transition-all duration-200 border ${
                    input.trim() && !isLoading 
                    ? 'bg-amber-800 text-white hover:bg-amber-700 border-amber-700 shadow-lg' 
                    : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                }`}
            >
                {isLoading ? (
                   <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
            </button>
        </div>
        <div className="text-center mt-4">
            <p className="text-[9px] text-slate-700 uppercase tracking-[0.2em] font-sans">
                Privileged & Confidential Work Product
            </p>
        </div>
      </div>
    </div>
  );
});

export default ChatInterface;