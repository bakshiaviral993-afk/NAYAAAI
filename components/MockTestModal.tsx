import React, { useState, useEffect, useRef } from 'react';
import { generateMockTestQuestions } from '../services/geminiService';
import { MockQuestion, SubjectPerformance } from '../types';
import { jsPDF } from "jspdf";

interface MockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TestStatus = 'intro' | 'loading' | 'active' | 'result';

const MockTestModal: React.FC<MockTestModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<TestStatus>('intro');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [analysis, setAnalysis] = useState<SubjectPerformance[]>([]);
  
  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [finalTimeStr, setFinalTimeStr] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'active') {
        setStartTime(Date.now());
        timerRef.current = window.setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (totalSeconds: number) => {
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const startTest = async (count: number) => {
    setStatus('loading');
    setSeconds(0);
    const q = await generateMockTestQuestions(count);
    if (q && q.length > 0) {
      setQuestions(q);
      setStatus('active');
      setCurrentQuestionIndex(0);
      setUserAnswers({});
    } else {
      alert("Failed to generate test questions. Please check your internet connection.");
      setStatus('intro');
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitTest();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitTest = () => {
    // Stop Timer
    if (timerRef.current) clearInterval(timerRef.current);
    setFinalTimeStr(formatTime(seconds));

    let correctCount = 0;
    const subjectStats: Record<string, { total: number; correct: number }> = {};

    questions.forEach((q, idx) => {
      // Initialize subject if new
      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = { total: 0, correct: 0 };
      }
      subjectStats[q.subject].total += 1;

      // Check answer
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
        subjectStats[q.subject].correct += 1;
      }
    });

    setScore(correctCount);
    
    // Convert stats to array
    const analysisArray: SubjectPerformance[] = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      total: stats.total,
      correct: stats.correct
    }));

    setAnalysis(analysisArray);
    setStatus('result');
  };

  const resetTest = () => {
    setStatus('intro');
    setQuestions([]);
    setUserAnswers({});
    setScore(0);
    setSeconds(0);
  };

  const getFeedbackMessage = (perf: SubjectPerformance) => {
      const percentage = (perf.correct / perf.total) * 100;
      if (percentage >= 80) return "Excellent grasp of this subject.";
      if (percentage >= 50) return "Good, but review key case laws.";
      return "Critical area for improvement. Revise Bare Act sections.";
  };

  const generateResultPDF = () => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = 35; // Start lower to accommodate header

        // Title
        doc.setFont("times", "bold");
        doc.setFontSize(18);
        doc.setTextColor(10, 26, 47); // Midnight Blue
        doc.text("AIBE MOCK TEST REPORT", pageWidth / 2, yPos, { align: "center" });
        yPos += 15;

        // Score Summary
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Score: ${score} / ${questions.length}`, margin, yPos);
        doc.text(`Percentage: ${Math.round((score / questions.length) * 100)}%`, margin + 80, yPos);
        yPos += 8;
        doc.text(`Time Taken: ${finalTimeStr}`, margin, yPos);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 80, yPos);
        yPos += 15;

        doc.setLineWidth(0.5);
        doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

        // Subject Analysis
        doc.setFontSize(14);
        doc.text("Performance Analysis", margin, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont("times", "normal");
        analysis.forEach(item => {
            const feedback = getFeedbackMessage(item);
            const line = `${item.subject}: ${item.correct}/${item.total} - ${feedback}`;
            doc.text(line, margin, yPos);
            yPos += 7;
        });

        yPos += 10;
        doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

        // Detailed Answers
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text("Detailed Review", margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("times", "normal");

        questions.forEach((q, idx) => {
            // Check for page break
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 35; // Reset to top below header
            }

            const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
            const status = isCorrect ? "CORRECT" : "INCORRECT";
            const color = isCorrect ? [0, 100, 0] : [200, 0, 0];

            doc.setFont("times", "bold");
            const qTitle = `Q${idx + 1}. ${q.question}`;
            const splitTitle = doc.splitTextToSize(qTitle, pageWidth - 40);
            doc.text(splitTitle, margin, yPos);
            yPos += (splitTitle.length * 5) + 2;

            doc.setFont("times", "normal");
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(`Your Answer: ${q.options[userAnswers[idx]] || "Skipped"} (${status})`, margin, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 5;
            
            if (!isCorrect) {
                doc.text(`Correct Answer: ${q.options[q.correctAnswerIndex]}`, margin, yPos);
                yPos += 5;
            }

            doc.setFont("times", "italic");
            doc.setTextColor(80, 80, 80);
            const rationale = `Rationale: ${q.rationale}`;
            const splitRationale = doc.splitTextToSize(rationale, pageWidth - 40);
            doc.text(splitRationale, margin, yPos);
            yPos += (splitRationale.length * 5) + 8;
            
            doc.setTextColor(0, 0, 0); // Reset
        });

        // Add Headers and Footers to all pages
        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // HEADER
            doc.setFont("times", "bold");
            doc.setFontSize(10);
            doc.setTextColor(10, 26, 47); // Midnight Blue
            doc.text("NYAYAAI - INDIAN LEGAL INTELLIGENCE", pageWidth / 2, 15, { align: "center" });
            
            doc.setDrawColor(203, 161, 53); // Gold
            doc.setLineWidth(0.5);
            doc.line(margin, 20, pageWidth - margin, 20);

            // FOOTER
            doc.setFont("times", "normal");
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128); // Light Grey
            doc.text(`Generated by NyayaAI Mock Test System`, margin, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
        }

        doc.save("NyayaAI_MockTest_Report.pdf");
    } catch (e) {
        console.error("PDF Report Error:", e);
        alert("Failed to generate PDF report.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-[#0A1A2F] border border-[#CBA135]/40 shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1E3A5F] bg-[#112240] flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-[#0A1A2F] border border-[#CBA135] flex items-center justify-center text-[#CBA135] font-serif-heading font-bold">
                    MT
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-100 serif-heading tracking-wide">AIBE Mock Test</h2>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Practice Mode</span>
                 </div>
            </div>
            
            {status === 'active' && (
                <div className="px-4 py-1 bg-[#0A1A2F] border border-[#CBA135]/30 text-[#CBA135] font-mono font-bold">
                    {formatTime(seconds)}
                </div>
            )}

            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative bg-[#0A1A2F]">
            
            {/* INTRO VIEW */}
            {status === 'intro' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-6 bg-[#112240] border border-[#1E3A5F]">
                        <svg className="w-16 h-16 text-[#CBA135]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <h3 className="text-2xl font-serif-heading text-slate-100">Ready to test your knowledge?</h3>
                    <p className="text-slate-400 max-w-md font-sans">
                        Take a generated mock test based on **Previous AIBE Exam Papers**. 
                        We will analyze your performance and provide actionable feedback.
                    </p>
                    
                    <div className="flex gap-4 mt-4">
                        <button 
                            onClick={() => startTest(10)}
                            className="px-6 py-4 bg-[#112240] hover:bg-[#1E3A5F] text-slate-200 border border-[#1E3A5F] transition-all flex flex-col items-center w-40"
                        >
                            <span className="text-lg font-bold font-serif-heading">Quick Drill</span>
                            <span className="text-xs text-slate-500 uppercase mt-1">10 Questions</span>
                        </button>
                        <button 
                            onClick={() => startTest(50)}
                            className="px-6 py-4 bg-[#00A86B] hover:bg-[#008C59] text-white shadow-lg transition-all border border-[#008C59] flex flex-col items-center w-40"
                        >
                            <span className="text-lg font-bold font-serif-heading">Full Mock</span>
                            <span className="text-xs text-white/80 uppercase mt-1">50 Questions</span>
                        </button>
                    </div>
                </div>
            )}

            {/* LOADING VIEW */}
            {status === 'loading' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <svg className="animate-spin w-12 h-12 text-[#CBA135] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-300 font-serif-heading text-lg">Compiling Previous Year Questions...</p>
                    <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-sans">Sourcing from AIBE Archives</p>
                </div>
            )}

            {/* ACTIVE TEST VIEW - UNIFIED COMPACT CARD */}
            {status === 'active' && questions.length > 0 && (
                <div className="max-w-4xl mx-auto h-full flex flex-col justify-center font-sans">
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase tracking-widest">
                            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <span>{questions[currentQuestionIndex].subject}</span>
                        </div>
                        <div className="w-full bg-[#112240] h-1 border border-[#1E3A5F]">
                            <div 
                                className="bg-[#CBA135] h-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Unified Test Card - Compact Layout */}
                    <div className="bg-[#112240] border border-[#1E3A5F] shadow-2xl flex flex-col overflow-hidden max-h-full">
                        
                        {/* Question Area - Reduced padding */}
                        <div className="p-4 md:p-5 border-b border-[#1E3A5F] bg-[#0A1A2F]/50 flex-shrink-0">
                            <h3 className="text-base md:text-lg font-serif-heading text-slate-100 leading-relaxed font-medium">
                                {questions[currentQuestionIndex].question}
                            </h3>
                        </div>

                        {/* Options Area - Reduced padding & text size */}
                        <div className="p-4 md:p-5 bg-[#112240] overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 gap-2">
                                {questions[currentQuestionIndex].options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        className={`w-full text-left p-3 border transition-all flex items-start gap-3 group ${
                                            userAnswers[currentQuestionIndex] === idx
                                            ? 'bg-[#CBA135]/20 border-[#CBA135] text-slate-100'
                                            : 'bg-[#0A1A2F] border-[#1E3A5F] text-slate-400 hover:bg-[#1a2f55]'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 border flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                                            userAnswers[currentQuestionIndex] === idx
                                            ? 'border-[#CBA135] bg-[#CBA135] text-[#0A1A2F]'
                                            : 'border-slate-600 text-slate-600 group-hover:border-slate-400 group-hover:text-slate-400'
                                        }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="font-sans text-sm pt-0.5 leading-relaxed">{option}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Footer - Compact */}
                        <div className="p-3 border-t border-[#1E3A5F] bg-[#0A1A2F] flex justify-between items-center flex-shrink-0">
                             <button 
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className={`px-4 py-2 text-xs font-medium transition-colors ${currentQuestionIndex === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                            >
                                ← Previous
                            </button>
                            <button 
                                onClick={handleNext}
                                className="px-6 py-2 bg-[#00A86B] hover:bg-[#008C59] text-white font-bold tracking-wide border border-[#008C59] text-xs uppercase"
                            >
                                {currentQuestionIndex === questions.length - 1 ? 'Finish Test' : 'Next Question →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULT VIEW */}
            {status === 'result' && (
                <div className="h-full max-w-4xl mx-auto overflow-y-auto pr-2 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        
                        {/* Score Card */}
                        <div className="bg-[#112240] p-6 border border-[#1E3A5F] flex flex-col items-center justify-center text-center">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Total Score</h3>
                            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-[#0A1A2F]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-[#CBA135]" strokeDasharray={`${(score / questions.length) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-4xl font-serif-heading font-bold text-white">{score}</span>
                                    <span className="text-sm text-slate-500">/ {questions.length}</span>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-slate-400 bg-[#0A1A2F] px-3 py-1 border border-[#1E3A5F]">
                                Time Taken: <span className="text-[#CBA135]">{finalTimeStr}</span>
                            </div>
                        </div>

                        {/* Analysis Card */}
                        <div className="md:col-span-2 bg-[#112240] p-6 border border-[#1E3A5F] overflow-hidden">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actionable Feedback</h3>
                                <button
                                    onClick={generateResultPDF}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#CBA135]/10 text-[#CBA135] hover:bg-[#CBA135]/20 border border-[#CBA135]/40 text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Report
                                </button>
                             </div>
                             <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
                                {analysis.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-[#0A1A2F] border border-[#1E3A5F]">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300 font-serif-heading font-bold">{item.subject}</span>
                                            <span className={`${item.correct === item.total ? 'text-green-500' : item.correct === 0 ? 'text-red-500' : 'text-[#CBA135]'}`}>
                                                {item.correct}/{item.total}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 italic">
                                            {getFeedbackMessage(item)}
                                        </p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Detailed Review */}
                    <h3 className="text-lg font-serif-heading text-slate-200 mb-4 border-b border-[#1E3A5F] pb-2">Detailed Answer Key & Rationale</h3>
                    <div className="space-y-6 pb-8">
                        {questions.map((q, idx) => {
                            const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
                            return (
                                <div key={idx} className={`p-4 border ${isCorrect ? 'border-[#1E3A5F] bg-[#112240]' : 'border-red-900/30 bg-red-900/10'}`}>
                                    <div className="flex gap-3">
                                        <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold border ${isCorrect ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-red-900/20 text-red-500 border-red-900/50'}`}>
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-slate-200 font-serif-heading mb-3">{q.question}</p>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={`text-sm px-3 py-2 border ${
                                                        optIdx === q.correctAnswerIndex 
                                                        ? 'bg-green-900/10 text-green-400 border-green-900/50' 
                                                        : optIdx === userAnswers[idx] && !isCorrect
                                                            ? 'bg-red-900/10 text-red-400 border-red-900/50'
                                                            : 'text-slate-500 border-transparent'
                                                    }`}>
                                                        {String.fromCharCode(65 + optIdx)}. {opt}
                                                        {optIdx === q.correctAnswerIndex && <span className="ml-2">✓</span>}
                                                        {optIdx === userAnswers[idx] && !isCorrect && <span className="ml-2">✗</span>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-sm bg-[#0A1A2F] p-3 border border-[#1E3A5F] text-slate-400 italic">
                                                <span className="font-bold text-[#CBA135] not-italic mr-2">Rationale:</span>
                                                {q.rationale}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="sticky bottom-0 bg-[#0A1A2F]/95 backdrop-blur border-t border-[#1E3A5F] p-4 -mx-4 -mb-4 flex justify-end">
                        <button 
                            onClick={resetTest}
                            className="px-6 py-2 bg-[#112240] hover:bg-[#1E3A5F] text-slate-300 mr-3 border border-[#1E3A5F]"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => { resetTest(); }}
                            className="px-6 py-2 bg-[#00A86B] hover:bg-[#008C59] text-white border border-[#008C59]"
                        >
                            Take Another Test
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default MockTestModal;