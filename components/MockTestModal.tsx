import React, { useState } from 'react';
import { generateMockTestQuestions } from '../services/geminiService';
import { MockQuestion, SubjectPerformance } from '../types';

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

  if (!isOpen) return null;

  const startTest = async () => {
    setStatus('loading');
    const q = await generateMockTestQuestions();
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-slate-900 rounded-lg shadow-2xl max-w-4xl w-full border border-slate-700 flex flex-col h-[85vh] relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-amber-900/20 border border-amber-600/30 flex items-center justify-center text-amber-500 font-serif font-bold">
                    MT
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-100 serif tracking-wide">AIBE Mock Test</h2>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Practice Mode</span>
                 </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 relative">
            
            {/* INTRO VIEW */}
            {status === 'intro' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-6 bg-amber-900/10 rounded-full border border-amber-900/30">
                        <svg className="w-16 h-16 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <h3 className="text-2xl font-serif text-slate-100">Ready to test your knowledge?</h3>
                    <p className="text-slate-400 max-w-md">
                        Take a generated mock test based on the All India Bar Examination syllabus. 
                        We will analyze your performance across Constitutional Law, IPC, CrPC, and more.
                    </p>
                    <ul className="text-left text-sm text-slate-500 space-y-2 bg-slate-950 p-4 rounded border border-slate-800">
                        <li className="flex items-center gap-2"><span className="text-amber-600">✓</span> 10 Questions</li>
                        <li className="flex items-center gap-2"><span className="text-amber-600">✓</span> Real-time Scoring</li>
                        <li className="flex items-center gap-2"><span className="text-amber-600">✓</span> Detailed Legal Reasoning</li>
                        <li className="flex items-center gap-2"><span className="text-amber-600">✓</span> Subject-wise Breakdown</li>
                    </ul>
                    <button 
                        onClick={startTest}
                        className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded font-medium shadow-lg hover:shadow-amber-900/20 transition-all border border-amber-600"
                    >
                        Start Mock Test
                    </button>
                </div>
            )}

            {/* LOADING VIEW */}
            {status === 'loading' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <svg className="animate-spin w-12 h-12 text-amber-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-300 font-serif text-lg">Compiling High-Impact Questions...</p>
                    <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Sourcing from AIBE Archives</p>
                </div>
            )}

            {/* ACTIVE TEST VIEW */}
            {status === 'active' && questions.length > 0 && (
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-slate-500 mb-1 uppercase tracking-widest">
                            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <span>{questions[currentQuestionIndex].subject}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div 
                                className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Question */}
                    <div className="bg-[#13151a] p-6 rounded-lg border border-slate-800 mb-6 shadow-lg">
                        <h3 className="text-xl font-serif text-slate-100 leading-relaxed">
                            {questions[currentQuestionIndex].question}
                        </h3>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 flex-1">
                        {questions[currentQuestionIndex].options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3 group ${
                                    userAnswers[currentQuestionIndex] === idx
                                    ? 'bg-amber-900/30 border-amber-600 text-slate-100'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-600'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    userAnswers[currentQuestionIndex] === idx
                                    ? 'border-amber-500 bg-amber-500'
                                    : 'border-slate-600 group-hover:border-slate-400'
                                }`}>
                                    {userAnswers[currentQuestionIndex] === idx && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                </div>
                                <span className="font-serif text-base">{option}</span>
                            </button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-800">
                        <button 
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0}
                            className={`px-4 py-2 rounded text-sm ${currentQuestionIndex === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                        >
                            Previous
                        </button>
                        <button 
                            onClick={handleNext}
                            className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded shadow-lg transition-colors font-medium border border-amber-600/50"
                        >
                            {currentQuestionIndex === questions.length - 1 ? 'Submit Test' : 'Next Question'}
                        </button>
                    </div>
                </div>
            )}

            {/* RESULT VIEW */}
            {status === 'result' && (
                <div className="h-full max-w-4xl mx-auto overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        
                        {/* Score Card */}
                        <div className="bg-[#13151a] p-6 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Total Score</h3>
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-amber-500" strokeDasharray={`${(score / questions.length) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-4xl font-serif font-bold text-white">{score}</span>
                                    <span className="text-sm text-slate-500">/ {questions.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Card */}
                        <div className="md:col-span-2 bg-[#13151a] p-6 rounded-lg border border-slate-800">
                             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Areas of Improvement</h3>
                             <div className="space-y-4">
                                {analysis.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300 font-serif">{item.subject}</span>
                                            <span className={`${item.correct === item.total ? 'text-green-500' : item.correct === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                                {item.correct}/{item.total} Correct
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${item.correct === item.total ? 'bg-green-600' : 'bg-amber-600'}`}
                                                style={{ width: `${(item.correct / item.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Detailed Review */}
                    <h3 className="text-lg font-serif text-slate-200 mb-4 border-b border-slate-800 pb-2">Detailed Answer Key & Rationale</h3>
                    <div className="space-y-6 pb-8">
                        {questions.map((q, idx) => {
                            const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
                            return (
                                <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'border-slate-800 bg-[#13151a]' : 'border-red-900/30 bg-red-900/10'}`}>
                                    <div className="flex gap-3">
                                        <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-slate-200 font-serif mb-3">{q.question}</p>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={`text-sm px-3 py-2 rounded ${
                                                        optIdx === q.correctAnswerIndex 
                                                        ? 'bg-green-900/20 text-green-400 border border-green-900/50' 
                                                        : optIdx === userAnswers[idx] && !isCorrect
                                                            ? 'bg-red-900/20 text-red-400 border border-red-900/50'
                                                            : 'text-slate-500'
                                                    }`}>
                                                        {String.fromCharCode(65 + optIdx)}. {opt}
                                                        {optIdx === q.correctAnswerIndex && <span className="ml-2">✓</span>}
                                                        {optIdx === userAnswers[idx] && !isCorrect && <span className="ml-2">✗</span>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-sm bg-slate-950 p-3 rounded border border-slate-800/50 text-slate-400 italic">
                                                <span className="font-bold text-amber-700 not-italic mr-2">Rationale:</span>
                                                {q.rationale}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 -mx-4 -mb-4 flex justify-end">
                        <button 
                            onClick={resetTest}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded mr-3 border border-slate-700"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => { resetTest(); startTest(); }}
                            className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded shadow-lg border border-amber-600"
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