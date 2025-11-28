import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// A simplified parser to handle basic formatting without heavy dependencies
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  if (!content) return null;

  // Split by newlines to handle paragraphs
  const lines = content.split('\n');

  return (
    <div className={`space-y-4 font-sans text-slate-300 ${className}`}>
      {lines.map((line, index) => {
        // Handle Empty Lines
        if (line.trim() === '') return <div key={index} className="h-2" />;

        // Handle Bullet Points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
           const text = line.trim().substring(2);
           return (
             <div key={index} className="flex items-start ml-6">
               <span className="mr-3 text-[#CBA135] mt-1.5 text-[10px]">♦</span>
               <span className="text-slate-300 leading-relaxed"><InlineParser text={text} /></span>
             </div>
           );
        }

        // Handle Numbered Lists
        if (/^\d+\.\s/.test(line.trim())) {
            const match = line.trim().match(/^(\d+\.)\s(.*)/);
            if (match) {
                return (
                    <div key={index} className="flex items-start ml-6">
                        <span className="mr-3 font-bold text-[#CBA135] min-w-[1.5rem] font-serif">{match[1]}</span>
                        <span className="text-slate-300 leading-relaxed"><InlineParser text={match[2]} /></span>
                    </div>
                )
            }
        }

        // Handle Headings (###)
        if (line.trim().startsWith('### ')) {
            return <h3 key={index} className="text-lg font-bold text-[#CBA135] mt-6 mb-3 uppercase tracking-wider text-sm border-b border-[#CBA135]/30 pb-1 font-serif"><InlineParser text={line.substring(4)} /></h3>;
        }
        if (line.trim().startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold text-slate-200 mt-8 mb-4 border-b border-slate-700 pb-2 font-serif"><InlineParser text={line.substring(3)} /></h2>;
        }

        // Handle Blockquotes (Case Laws or Sections)
        if (line.trim().startsWith('> ')) {
            return (
                <div key={index} className="border-l-4 border-[#CBA135] pl-4 my-4 italic text-slate-400 bg-[#112240] py-3 pr-2 font-serif">
                    <InlineParser text={line.substring(2)} />
                </div>
            );
        }

        // Default Paragraph
        return <p key={index} className="text-slate-300 leading-relaxed text-[1.05rem]"><InlineParser text={line} /></p>;
      })}
    </div>
  );
};

// Helper to parse bold (**text**) and italic (*text*)
const InlineParser: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic text-slate-400 font-medium font-serif">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-[#0A1A2F] text-[#CBA135] px-1.5 py-0.5 border border-[#1E3A5F] text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </>
  );
};

export default MarkdownRenderer;