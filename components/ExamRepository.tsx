import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import { generateExamPaper } from '../services/geminiService';

interface ExamRepositoryProps {
  isOpen: boolean;
  onClose: () => void;
}

// Data for AIBE Exams
const AIBE_EXAMS = [
    { id: '18', name: 'AIBE XVIII', year: '2023 (Dec)', type: 'AIBE' },
    { id: '17', name: 'AIBE XVII', year: '2023 (Feb)', type: 'AIBE' },
    { id: '16', name: 'AIBE XVI', year: '2021', type: 'AIBE' },
    { id: '15', name: 'AIBE XV', year: '2020', type: 'AIBE' },
    { id: '14', name: 'AIBE XIV', year: '2019', type: 'AIBE' },
    { id: '13', name: 'AIBE XIII', year: '2018', type: 'AIBE' },
    { id: '12', name: 'AIBE XII', year: '2018 (Jan)', type: 'AIBE' },
    { id: '11', name: 'AIBE XI', year: '2017', type: 'AIBE' },
    { id: '10', name: 'AIBE X', year: '2017 (Mar)', type: 'AIBE' },
];

// Data for BCI Qualifying Exams (Foreign Law Degrees)
const QUALIFYING_EXAMS = [
    // 18th Qualifying Exam (Recent)
    { id: '18-p1', name: 'Paper 1: Constitutional Law', year: '18th Qualifying Exam', type: 'QUALIFYING' },
    { id: '18-p2', name: 'Paper 2: Contract Law & Negotiable Instruments', year: '18th Qualifying Exam', type: 'QUALIFYING' },
    { id: '18-p3', name: 'Paper 3: Company Law', year: '18th Qualifying Exam', type: 'QUALIFYING' },
    { id: '18-p4', name: 'Paper 4: Civil Procedure Code', year: '18th Qualifying Exam', type: 'QUALIFYING' },
    { id: '18-p5', name: 'Paper 5: Criminal Procedure Code', year: '18th Qualifying Exam', type: 'QUALIFYING' },
    { id: '18-p6', name: 'Paper 6: Legal Profession & Ethics', year: '18th Qualifying Exam', type: 'QUALIFYING' },

    // 15th Qualifying Exam (Sept 2019)
    { id: '15-p1', name: 'Paper 1: Constitutional Law', year: '15th Qualifying Exam (Sept 2019)', type: 'QUALIFYING' },
    { id: '15-p2', name: 'Paper 2: Contract Law & Negotiable Instruments', year: '15th Qualifying Exam (Sept 2019)', type: 'QUALIFYING' },
    { id: '15-p3', name: 'Paper 3: Company Law', year: '15th Qualifying Exam (Sept 2019)', type: 'QUALIFYING' },
    { id: '15-p4', name: 'Paper 4: Civil Procedure Code', year: '15th Qualifying Exam (Sept 2019)', type: 'QUALIFYING' },
    { id: '15-p5', name: 'Paper 5: Criminal Procedure Code', year: '15th Qualifying Exam (Sept 2019)', type: 'QUALIFYING' },
    { id: '15-p6', name: 'Paper 6: Legal Profession & Ethics', year: '15th Qualifying Exam (Sept 2019)', type: 'QUALIFYING' },
    
    // 14th Qualifying Exam (Nov 2018)
    { id: '14-p1', name: 'Paper 1: Constitutional Law', year: '14th Qualifying Exam (Nov 2018)', type: 'QUALIFYING' },
    { id: '14-p2', name: 'Paper 2: Contract Law & Negotiable Instruments', year: '14th Qualifying Exam (Nov 2018)', type: 'QUALIFYING' },
    { id: '14-p3', name: 'Paper 3: Company Law', year: '14th Qualifying Exam (Nov 2018)', type: 'QUALIFYING' },
    { id: '14-p4', name: 'Paper 4: Civil Procedure Code', year: '14th Qualifying Exam (Nov 2018)', type: 'QUALIFYING' },
    { id: '14-p5', name: 'Paper 5: Criminal Procedure Code', year: '14th Qualifying Exam (Nov 2018)', type: 'QUALIFYING' },
    { id: '14-p6', name: 'Paper 6: Legal Profession & Ethics', year: '14th Qualifying Exam (Nov 2018)', type: 'QUALIFYING' },

    // March 2014 Exam
    { id: '2014-p1', name: 'Paper 1: Constitutional Law', year: 'Qualifying Exam (March 2014)', type: 'QUALIFYING' },
    { id: '2014-p2', name: 'Paper 2: Contract Law', year: 'Qualifying Exam (March 2014)', type: 'QUALIFYING' },
    { id: '2014-p3', name: 'Paper 3: Company Law', year: 'Qualifying Exam (March 2014)', type: 'QUALIFYING' },
    { id: '2014-p4', name: 'Paper 4: Civil Procedure Code', year: 'Qualifying Exam (March 2014)', type: 'QUALIFYING' },
    { id: '2014-p5', name: 'Paper 5: Criminal Procedure Code', year: 'Qualifying Exam (March 2014)', type: 'QUALIFYING' },
    { id: '2014-p6', name: 'Paper 6: Legal Profession', year: 'Qualifying Exam (March 2014)', type: 'QUALIFYING' },
];

const SUBJECT_WEIGHTAGE = [
    { subject: "Constitutional Law", marks: 10 },
    { subject: "I.P.C (Indian Penal Code)", marks: 8 },
    { subject: "Cr.P.C (Criminal Procedure Code)", marks: 10 },
    { subject: "C.P.C (Code of Civil Procedure)", marks: 10 },
    { subject: "Evidence Act", marks: 8 },
    { subject: "Alternative Dispute Resolution (ADR)", marks: 4 },
    { subject: "Family Law", marks: 8 },
    { subject: "Public Interest Litigation (PIL)", marks: 4 },
    { subject: "Administrative Law", marks: 3 },
    { subject: "Professional Ethics & Cases", marks: 4 },
    { subject: "Company Law", marks: 2 },
    { subject: "Environmental Law", marks: 2 },
    { subject: "Cyber Law", marks: 2 },
    { subject: "Labour & Industrial Laws", marks: 4 },
    { subject: "Law of Tort, MV Act & CPA", marks: 5 },
    { subject: "Law related to Taxation", marks: 4 },
    { subject: "Law of Contract, Specific Relief, Prop Laws", marks: 8 },
    { subject: "Land Acquisition Act", marks: 2 },
    { subject: "Intellectual Property Laws", marks: 2 },
];

const ExamRepository: React.FC<ExamRepositoryProps> = ({ isOpen, onClose }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'AIBE' | 'QUALIFYING' | 'SYLLABUS'>('AIBE');

  if (!isOpen) return null;

  const currentList = activeTab === 'AIBE' ? AIBE_EXAMS : QUALIFYING_EXAMS;

  const filteredExams = currentList.filter(exam => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exam.year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (exam: typeof AIBE_EXAMS[0]) => {
    setLoadingId(exam.id);
    setDownloadProgress(5); 

    try {
        // Estimated size for a full length paper (approx 15-20 pages of text)
        const estimatedSize = 60000; 
        
        // Pass the name and type logic happens in service
        const content = await generateExamPaper(`${exam.name} - ${exam.year}`, (currentLength) => {
            const percentage = Math.min(95, Math.round((currentLength / estimatedSize) * 100));
            setDownloadProgress(percentage);
        });
        
        setDownloadProgress(100);

        if (!content || content.startsWith('AI_ERROR')) {
            alert("Unable to generate the exam paper at this time. Please try again later.\n\n" + (content || ""));
            return;
        }

        try {
            await new Promise(r => setTimeout(r, 500));
            generatePDF(exam, content);
        } catch (pdfError) {
            console.error("PDF Generation failed:", pdfError);
            alert("Error creating PDF file. Please ensure your browser supports downloads.");
        }

    } catch (e) {
        console.error("Failed to download", e);
        alert("Failed to generate exam paper. Please try again.");
    } finally {
        setLoadingId(null);
        setDownloadProgress(0);
    }
  };

  const handleOriginalDownload = (exam: typeof AIBE_EXAMS[0]) => {
      // Use filetype:pdf to attempt direct file discovery
      const query = `${exam.name} ${exam.year} question paper filetype:pdf`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const generatePDF = (exam: typeof AIBE_EXAMS[0], content: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Header
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(exam.name.toUpperCase(), pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Year: ${exam.year} | Source: Bar Council of India Records (AI Retrieved)`, pageWidth / 2, 28, { align: "center" });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);

    let yPosition = 45;
    
    // Content Processing
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    
    // Handle smart quotes and other chars that might break jsPDF
    const cleanContent = content
        .replace(/[^\x00-\x7F]/g, (char) => {
            // Map common smart quotes/hyphens to ASCII
            const map: {[key: string]: string} = {
                '“': '"', '”': '"', '‘': "'", '’': "'", '–': '-', '—': '-'
            };
            return map[char] || " ";
        });

    const lines = doc.splitTextToSize(cleanContent, pageWidth - (margin * 2));
    
    for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20; 
        }
        
        const line = lines[i];
        // Bold headers for Questions or Parts
        if (
            line.trim().startsWith('**') || 
            line.trim().startsWith('Question') || 
            line.trim().startsWith('PART -') || 
            line.trim().includes('Marks)')
        ) {
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }

        doc.text(line.replace(/\*\*/g, ''), margin, yPosition);
        yPosition += 6;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`NyayaAI - Legal Repository | Compiled from official records`, margin, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    doc.save(`${exam.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-[#0A1A2F] border border-[#CBA135]/40 shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex flex-col p-4 border-b border-[#1E3A5F] bg-[#112240] gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00A86B]/20 border border-[#00A86B]/40">
                        <svg className="w-5 h-5 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 serif-heading tracking-wide">Exam Repository</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Official Bar Council Archives</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex p-1 bg-[#0A1A2F] border border-[#1E3A5F] w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('AIBE')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'AIBE' 
                            ? 'bg-[#CBA135] text-[#0A1A2F]' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        AIBE Exams
                    </button>
                    <button 
                        onClick={() => setActiveTab('QUALIFYING')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'QUALIFYING' 
                            ? 'bg-[#CBA135] text-[#0A1A2F]' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        BCI Qualifying
                    </button>
                    <button 
                        onClick={() => setActiveTab('SYLLABUS')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'SYLLABUS' 
                            ? 'bg-[#CBA135] text-[#0A1A2F]' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Syllabus & Materials
                    </button>
                </div>

                {activeTab !== 'SYLLABUS' && (
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-[#1E3A5F] bg-[#0A1A2F] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#CBA135] focus:ring-1 focus:ring-[#CBA135]/50 text-sm font-sans"
                            placeholder="Search Year or Subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 flex-1 scrollbar-hide bg-[#0A1A2F]">
            
            {/* SYLLABUS TAB CONTENT */}
            {activeTab === 'SYLLABUS' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-[#112240] p-6 border border-[#1E3A5F]">
                             <h3 className="text-xl font-bold text-slate-200 serif-heading mb-4 border-b border-slate-700 pb-2">AIBE Subject Weightage</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {SUBJECT_WEIGHTAGE.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-800/50 py-2">
                                        <span className="text-slate-400 font-sans">{item.subject}</span>
                                        <span className="font-bold text-[#CBA135]">{item.marks} Qs</span>
                                    </div>
                                ))}
                             </div>
                             <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between font-bold text-slate-200">
                                <span>TOTAL</span>
                                <span>100 Questions</span>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#112240] p-6 border border-[#CBA135]/30">
                            <h3 className="text-lg font-bold text-[#CBA135] serif-heading mb-3">Recommended Material</h3>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-[#0A1A2F] border border-[#CBA135]/30">
                                    <svg className="w-8 h-8 text-[#CBA135]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-200">Lawmann's Bare Acts</h4>
                                    <p className="text-xs text-slate-400 mt-1">Complete 25 Books Set covering all 19 subjects.</p>
                                </div>
                            </div>
                            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                                <li>Allowed in Examination Hall (Without Notes)</li>
                                <li>Covers IPC, CrPC, CPC, Evidence</li>
                                <li>Essential for Case Law citations</li>
                            </ul>
                            <button 
                                onClick={() => window.open('https://www.google.com/search?q=Lawmann%27s+Bare+Act+25+Books+Set+AIBE', '_blank')}
                                className="w-full mt-4 py-2 bg-[#CBA135]/10 hover:bg-[#CBA135]/20 text-[#CBA135] text-xs font-bold uppercase tracking-wider border border-[#CBA135]/50 transition-all"
                            >
                                Find Book Set
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXAM LIST TABS */}
            {activeTab !== 'SYLLABUS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredExams.length > 0 ? (
                        filteredExams.map((exam) => (
                        <div key={exam.id} className="bg-[#112240] p-4 border border-[#1E3A5F] hover:border-[#CBA135] transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none">
                                <svg className="w-16 h-16 text-[#CBA135]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                            </div>
                            
                            <div className="relative z-10 pr-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-bold text-slate-200 serif-heading leading-snug">{exam.name}</h3>
                                </div>
                                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-[#0A1A2F] text-slate-400 border border-[#1E3A5F]">
                                    {exam.year}
                                </span>
                                {activeTab === 'QUALIFYING' && (
                                    <span className="inline-block ml-2 mt-2 px-2 py-0.5 text-[10px] font-bold bg-[#CBA135]/20 text-[#CBA135] border border-[#CBA135]/30">
                                        Subjective
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 relative z-10 space-y-2">
                                {loadingId === exam.id && (
                                    <div className="w-full bg-[#0A1A2F] h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-[#00A86B] h-full transition-all duration-300 ease-out"
                                            style={{ width: `${downloadProgress}%` }}
                                        ></div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleDownload(exam)}
                                        disabled={loadingId === exam.id}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 font-medium text-xs transition-all border ${
                                            loadingId === exam.id
                                            ? 'bg-[#0A1A2F] border-[#1E3A5F] text-slate-400 cursor-wait'
                                            : 'bg-[#00A86B] border-[#00A86B] text-white hover:bg-[#008C59]'
                                        }`}
                                    >
                                        {loadingId === exam.id ? (
                                            <>
                                                <span className="text-xs font-mono">{downloadProgress}%</span>
                                                <span>Retrieving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                <span>AI Compile</span>
                                            </>
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleOriginalDownload(exam)}
                                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border bg-[#0A1A2F] border-[#1E3A5F] text-slate-400 hover:text-[#CBA135] hover:border-[#CBA135] transition-all group/btn"
                                        title="Search for Original PDF File"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        <span className="text-[10px] font-bold uppercase hidden group-hover/btn:inline-block">Official PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                            <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm">No exam papers found for "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="p-3 border-t border-[#1E3A5F] bg-[#112240] flex justify-between items-center text-[10px] text-slate-500 font-sans">
             <span>* AI-Compiled based on BCI syllabus. Use "Official PDF" button for scanned copies.</span>
             <a 
                href="http://www.barcouncilofindia.org/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 text-[#CBA135]/80 hover:text-[#CBA135] transition-colors"
             >
                Visit Bar Council Official
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </a>
        </div>
      </div>
    </div>
  );
};

export default ExamRepository;