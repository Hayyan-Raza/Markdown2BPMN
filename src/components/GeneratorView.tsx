import { useState, useEffect, useCallback } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import { MarkdownEditor } from './MarkdownEditor';
import { BpmnViewer } from './BpmnViewer';
import { DownloadButton } from './DownloadButton';
import { ErrorBanner } from './ErrorBanner';
import { parseBpmnMarkdown } from '../utils/bpmnParser';

const INITIAL_MARKDOWN = `# Advanced BPMN Features
pool: Order Process
lane: Order Process > Customer
lane: Order Process > System

event: start [Customer] Place Order (start-message)
task: t1 [Customer] Fill Form (user)
task: t2 [System] Validate Stock (service, parallel)
gateway: g1 [System] Stock Check (complex)
task: t3 [System] Charge Card (service)
task: t4 [System] Ship Goods (manual, sequential)
task: t5 [System] Update DB (script, loop)
event: end [System] Order Fulfilled (end-terminate)
event: err [System] Out of Stock (end-error)

data: d1 [System] Order DB
note: n1 [System] Check warehouse API

flow: start -> t1
flow: t1 -> t2
flow: t2 -> g1
flow: g1 -> t3 [Yes]
flow: g1 -> err [No]
flow: t3 -> t5
flow: t5 -> t4
flow: t4 -> end
flow: d1 ..> t2
flow: n1 ..> g1
`;

export function GeneratorView() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [bpmnData, setBpmnData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(true);

  // Parse markdown with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed = parseBpmnMarkdown(markdown);
        setBpmnData(parsed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse diagram');
        setBpmnData(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [markdown]);

  const handleDownload = useCallback((format: 'svg' | 'png') => {
    const selector = '.react-flow__viewport';
    const element = document.querySelector(selector) as HTMLElement;

    if (!element) {
      console.error('Diagram element not found');
      return;
    }

    const options = {
      backgroundColor: '#fff',
      style: {
        transform: 'scale(1)', // Export at 1x scale
      },
    };

    const download = (dataUrl: string, ext: string) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `bpmn-diagram.${ext}`;
      a.click();
    };

    if (format === 'png') {
      toPng(element, options)
        .then((dataUrl) => download(dataUrl, 'png'))
        .catch((err) => console.error('Failed to export PNG', err));
    } else {
      toSvg(element, options)
        .then((dataUrl) => download(dataUrl, 'svg'))
        .catch((err) => console.error('Failed to export SVG', err));
    }
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      {/* Error Banner */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Download Button - Fixed Position */}
      <div className="absolute top-4 right-6 z-10">
        <DownloadButton onDownload={handleDownload} disabled={!!error} />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsEditorOpen(!isEditorOpen)}
        className="absolute top-4 left-4 z-20 p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 text-gray-700 hover:text-black transition-colors"
        title={isEditorOpen ? "Close Editor" : "Open Editor"}
      >
        {isEditorOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      {/* Split Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Markdown Editor */}
        <div
          className={`border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col ${isEditorOpen ? 'w-1/2 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}
        >
          <MarkdownEditor value={markdown} onChange={setMarkdown} />
        </div>

        {/* Right Panel - BPMN Viewer */}
        <div className="flex-1 bg-white relative">
          <BpmnViewer data={bpmnData} />
        </div>
      </div>
    </div>
  );
}