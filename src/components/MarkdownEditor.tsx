import React, { useRef, useEffect } from 'react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize if needed, but for now simple 100% height
    return (
        <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h2 className="text-sm font-medium text-gray-700">Editor</h2>
                </div>
                <span className="text-xs text-gray-500 font-mono">Markdown</span>
            </div>
            <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-relaxed"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    spellCheck={false}
                    placeholder="# Process Name&#10;&#10;pool: ..."
                />
            </div>
        </div>
    );
}
