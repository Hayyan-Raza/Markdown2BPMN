import React from 'react';
import { XCircle, X } from 'lucide-react';

interface ErrorBannerProps {
    message: string;
    onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
    return (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Parsing Error</h3>
                <p className="text-sm text-red-700 mt-1 font-mono bg-red-100/50 p-1 rounded inline-block">
                    {message}
                </p>
            </div>
            <button
                onClick={onDismiss}
                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-100 rounded"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
