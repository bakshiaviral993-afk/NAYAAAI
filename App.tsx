import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import LegalDisclaimer from './components/LegalDisclaimer';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      <LegalDisclaimer />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Navigation / History */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 w-72 bg-slate-950 text-slate-400 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-900
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-900 flex items-center gap-4 bg-slate-950">
          {/* Indian Law Logo - Scales of Justice */}
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-900 border border-amber-700/50 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(180,83,9,0.2)]">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4V7H20C21.1 7 22 7.9 22 9V11C22 11.55 21.55 12 21 12C20.45 12 20 11.55 20 11V9H14V12H19C19.55 12 20 12.45 20 13V15.5C20 17.14 18.89 18.5 17.38 18.9L16 21H18V23H6V21H8L6.62 18.9C5.11 18.5 4 17.14 4 15.5V13C4 12.45 4.45 12 5 12H10V9H4C4 11 2 11 2 9C2 7.9 2.9 7 4 7H10V4C10 2.9 10.9 2 12 2M7 14C6.45 14 6 14.45 6 15S6.45 16 7 16 8 15.55 8 15 7.55 14 7 14M17 14C16.45 14 16 14.45 16 15S16.45 16 17 16 18 15.55 18 15 17.55 14 17 14Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-100 serif tracking-[0.15em]">NYAYA<span className="text-amber-600">AI</span></h1>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 border-t border-slate-800 pt-1 mt-0.5">Indian Legal Intelligence</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-5">
            <button 
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-amber-950 hover:to-slate-900 text-amber-500 hover:text-amber-400 py-3 px-4 rounded border border-slate-800 hover:border-amber-800 transition-all group shadow-lg"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="font-serif tracking-wide text-sm font-semibold">NEW BRIEF</span>
            </button>
        </div>

        {/* History List (Mock) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 px-2">Recent Consultations</h3>
          
          <button className="w-full text-left p-3 rounded hover:bg-slate-900 transition-colors text-sm truncate text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800 flex items-center gap-2 group">
             <span className="text-slate-700 group-hover:text-amber-600 transition-colors">¶</span> IPC 302 vs BNS 103
          </button>
          <button className="w-full text-left p-3 rounded hover:bg-slate-900 transition-colors text-sm truncate text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800 flex items-center gap-2 group">
             <span className="text-slate-700 group-hover:text-amber-600 transition-colors">¶</span> Defamation Precedents
          </button>
          <button className="w-full text-left p-3 rounded hover:bg-slate-900 transition-colors text-sm truncate text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800 flex items-center gap-2 group">
             <span className="text-slate-700 group-hover:text-amber-600 transition-colors">¶</span> BNSS Bail Provisions
          </button>
        </div>

        {/* Developer Credit Footer */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/50">
            <div className="flex items-center justify-center space-x-2 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-500 font-sans uppercase tracking-widest">Developed by</span>
                <span className="text-[11px] text-amber-700 font-serif font-bold tracking-wide">Aviral Bakshi</span>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative bg-slate-950">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-slate-950 border-b border-slate-900 flex items-center px-4 justify-between z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold serif text-slate-200 tracking-wider">NYAYA<span className="text-amber-600">AI</span></span>
          </div>
        </div>

        {/* Chat Area */}
        <main className="flex-1 h-full overflow-hidden">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default App;