import React, { useState, useRef, useEffect } from 'react';
import ChatInterface, { ChatInterfaceHandle } from './components/ChatInterface';
import LegalDisclaimer from './components/LegalDisclaimer';
import ExamRepository from './components/ExamRepository';
import MockTestModal from './components/MockTestModal';
import { ChatSession } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isExamRepoOpen, setIsExamRepoOpen] = useState(false);
  const [isMockTestOpen, setIsMockTestOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const chatRef = useRef<ChatInterfaceHandle>(null);

  // Load saved sessions on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem('nyaya_sessions');
    if (storedSessions) {
        try {
            setSavedSessions(JSON.parse(storedSessions));
        } catch (e) {
            console.error("Failed to parse saved sessions", e);
        }
    }
  }, []);

  const handleSaveChat = () => {
    if (!chatRef.current) return;
    
    const currentMessages = chatRef.current.getMessages();
    // Don't save if only welcome message exists (length <= 1 usually)
    if (currentMessages.length <= 1) {
        alert("No conversation to save. Please start a consultation first.");
        return;
    }

    const title = prompt("Enter a title for this consultation:", `Legal Opinion - ${new Date().toLocaleDateString()}`);
    if (!title) return; // User cancelled

    const newSession: ChatSession = {
        id: Date.now().toString(),
        title: title,
        messages: currentMessages,
        lastModified: Date.now()
    };

    const updatedSessions = [newSession, ...savedSessions];
    setSavedSessions(updatedSessions);
    localStorage.setItem('nyaya_sessions', JSON.stringify(updatedSessions));
  };

  const handleLoadSession = (session: ChatSession) => {
      if (chatRef.current) {
          chatRef.current.loadMessages(session.messages);
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
      }
  };

  const handleNewBrief = () => {
    if (chatRef.current) {
        if (confirm("Start a new brief? Unsaved changes in the current chat will be lost.")) {
            chatRef.current.resetChat();
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        }
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this record?")) {
        const updated = savedSessions.filter(s => s.id !== sessionId);
        setSavedSessions(updated);
        localStorage.setItem('nyaya_sessions', JSON.stringify(updated));
    }
  }

  return (
    <div className="flex h-screen bg-[#0A1A2F] overflow-hidden text-slate-200 font-sans">
      <LegalDisclaimer />
      <ExamRepository isOpen={isExamRepoOpen} onClose={() => setIsExamRepoOpen(false)} />
      <MockTestModal isOpen={isMockTestOpen} onClose={() => setIsMockTestOpen(false)} />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Navigation / History */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 w-72 bg-[#0A1A2F] text-slate-400 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-[#CBA135]/20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[#CBA135]/20 flex items-center gap-4 bg-[#0A1A2F]">
          {/* Indian Law Logo - Scales of Justice */}
          <div className="w-12 h-12 flex-shrink-0 bg-[#112240] border border-[#CBA135] flex items-center justify-center text-[#CBA135] shadow-[0_0_15px_rgba(203,161,53,0.1)]">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4V7H20C21.1 7 22 7.9 22 9V11C22 11.55 21.55 12 21 12C20.45 12 20 11.55 20 11V9H14V12H19C19.55 12 20 12.45 20 13V15.5C20 17.14 18.89 18.5 17.38 18.9L16 21H18V23H6V21H8L6.62 18.9C5.11 18.5 4 17.14 4 15.5V13C4 12.45 4.45 12 5 12H10V9H4C4 11 2 11 2 9C2 7.9 2.9 7 4 7H10V4C10 2.9 10.9 2 12 2M7 14C6.45 14 6 14.45 6 15S6.45 16 7 16 8 15.55 8 15 7.55 14 7 14M17 14C16.45 14 16 14.45 16 15S16.45 16 17 16 18 15.55 18 15 17.55 14 17 14Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#E2E8F0] serif-heading tracking-[0.05em]">NYAYA<span className="text-[#CBA135]">AI</span></h1>
            <span className="text-[9px] uppercase tracking-widest text-[#CBA135]/70 border-t border-[#CBA135]/20 pt-1 mt-0.5">Indian Legal Intelligence</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 space-y-3">
            <button 
                onClick={handleNewBrief}
                className="w-full flex items-center justify-center gap-3 bg-[#00A86B] hover:bg-[#008C59] text-white py-3 px-4 transition-all group shadow-md shadow-[#00A86B]/20"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="tracking-wide text-sm font-semibold uppercase">New Brief</span>
            </button>

            <button 
                onClick={handleSaveChat}
                className="w-full flex items-center justify-center gap-3 bg-[#112240] hover:bg-[#1a2f55] text-slate-300 hover:text-[#CBA135] py-3 px-4 border border-[#1E3A5F] hover:border-[#CBA135]/50 transition-all group"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                <span className="tracking-wide text-sm font-semibold uppercase">Save Record</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setIsExamRepoOpen(true)}
                    className="w-full flex flex-col items-center justify-center gap-1 bg-[#112240] hover:bg-[#1a2f55] text-slate-400 hover:text-[#E2E8F0] py-3 px-2 border border-[#1E3A5F] hover:border-[#CBA135]/50 transition-all group"
                >
                    <svg className="w-5 h-5 group-hover:text-[#CBA135] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    <span className="tracking-wide text-[10px] font-semibold uppercase">Exams</span>
                </button>
                <button 
                    onClick={() => setIsMockTestOpen(true)}
                    className="w-full flex flex-col items-center justify-center gap-1 bg-[#112240] hover:bg-[#1a2f55] text-slate-400 hover:text-[#CBA135] py-3 px-2 border border-[#1E3A5F] hover:border-[#CBA135]/50 transition-all group"
                >
                    <svg className="w-5 h-5 group-hover:text-[#CBA135] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    <span className="tracking-wide text-[10px] font-semibold uppercase">Mock Trial</span>
                </button>
            </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          <h3 className="text-[10px] font-bold text-[#CBA135] uppercase tracking-widest mb-4 px-2 border-b border-[#CBA135]/20 pb-2">Docket History</h3>
          
          {savedSessions.length === 0 ? (
              <div className="text-center py-8 opacity-30">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  <span className="text-xs">No saved briefs</span>
              </div>
          ) : (
              savedSessions.map((session) => (
                <div key={session.id} className="group relative">
                    <button 
                        onClick={() => handleLoadSession(session)}
                        className="w-full text-left p-3 bg-transparent hover:bg-[#112240] transition-all border-l-2 border-transparent hover:border-[#CBA135] flex flex-col gap-1"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[#CBA135] text-lg leading-none">§</span>
                            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 truncate font-sans">{session.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-600 pl-5 uppercase tracking-wider group-hover:text-slate-500">
                            {new Date(session.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </span>
                    </button>
                    <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"
                        title="Delete Brief"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
              ))
          )}
        </div>

        {/* Developer Credit Footer */}
        <div className="p-4 border-t border-[#CBA135]/20 bg-[#081628]">
            <div className="flex items-center justify-center space-x-2 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-500 font-sans uppercase tracking-widest">Counsel</span>
                <span className="text-[11px] text-[#CBA135] serif-heading font-bold tracking-wide">Aviral Bakshi</span>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative bg-[#0A1A2F]">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-[#0A1A2F] border-b border-[#1E3A5F] flex items-center px-4 justify-between z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold serif-heading text-slate-200 tracking-wider">NYAYA<span className="text-[#CBA135]">AI</span></span>
          </div>
        </div>

        {/* Chat Area */}
        <main className="flex-1 h-full overflow-hidden">
          <ChatInterface ref={chatRef} />
        </main>
      </div>
    </div>
  );
};

export default App;