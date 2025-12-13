import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface DownloadButtonProps {
    onDownload: (format: 'svg' | 'png') => void;
    disabled?: boolean;
}

export function DownloadButton({ onDownload, disabled }: DownloadButtonProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="gap-2 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onDownload('svg')}>
                    Export as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload('png')}>
                    Export as PNG
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
