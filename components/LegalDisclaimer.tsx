import React, { useState, useEffect } from 'react';

const LegalDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAgreed = localStorage.getItem('nyaya_disclaimer_agreed');
    if (!hasAgreed) {
      setIsVisible(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('nyaya_disclaimer_agreed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 rounded shadow-2xl max-w-lg w-full p-8 border border-slate-700">
        <div className="flex items-center mb-6 border-b border-slate-800 pb-4">
          <svg className="w-8 h-8 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-100 serif tracking-wide">Legal Disclaimer</h2>
        </div>
        
        <div className="prose prose-sm text-slate-400 mb-8 font-light">
          <p className="mb-3">
            Welcome to <strong>NyayaAI</strong>. By accessing this interface, you acknowledge:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-3">
            <li>
              **Nature of Tool:** This application utilizes Artificial Intelligence to analyze Indian Law (IPC, BNS, CrPC, BNSS).
            </li>
            <li>
              **No Attorney-Client Privilege:** Use of this tool does not create an attorney-client relationship.
            </li>
            <li>
              **Verification Mandatory:** AI responses may contain inaccuracies. All citations must be cross-referenced with the Official Gazette of India.
            </li>
            <li>
              **Liability Waiver:** The developers assume no liability for legal strategies derived from this software.
            </li>
          </ul>
        </div>

        <button
          onClick={handleAgree}
          className="w-full bg-amber-700 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded transition-colors duration-200 shadow-lg border border-amber-600"
        >
          Acknowledge & Proceed
        </button>

        <div className="mt-6 pt-4 border-t border-slate-800/50 text-center">
            <p className="text-[10px] text-slate-600 font-sans tracking-widest uppercase">
                Developed by <span className="text-amber-700/80 font-bold">Aviral Bakshi</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;