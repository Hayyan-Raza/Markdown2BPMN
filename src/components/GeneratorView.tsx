import { useState, useEffect, useCallback } from 'react';
import { MarkdownEditor } from './MarkdownEditor';
import { BpmnViewer } from './BpmnViewer';
import { DownloadButton } from './DownloadButton';
import { ErrorBanner } from './ErrorBanner';
import { parseBpmnMarkdown } from '../utils/bpmnParser';

const INITIAL_MARKDOWN = `# Customer Order Process

pool: Customer
pool: Sales Department
pool: Warehouse

lane: Customer > Online Customer
lane: Sales Department > Sales Agent
lane: Warehouse > Fulfillment Team

task: start [Customer] Browse Products
task: order [Customer] Place Order
task: review [Sales] Review Order
gateway: check [Sales] Check Availability? (xor)
task: confirm [Sales] Confirm Order
task: reject [Sales] Reject Order
task: pack [Warehouse] Pack Items
task: ship [Warehouse] Ship Order
task: end [Customer] Receive Order

flow: start -> order
flow: order -> review
flow: review -> check
flow: check -> confirm [In Stock]
flow: check -> reject [Out of Stock]
flow: confirm -> pack
flow: pack -> ship
flow: ship -> end
flow: reject -> end
`;

export function GeneratorView() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [bpmnData, setBpmnData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    // Implementation would export the diagram
    console.log(`Downloading as ${format}...`);
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      {/* Error Banner */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Download Button - Fixed Position */}
      <div className="absolute top-4 right-6 z-10">
        <DownloadButton onDownload={handleDownload} disabled={!!error} />
      </div>

      {/* Split Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Markdown Editor */}
        <div className="w-1/2 border-r border-gray-200">
          <MarkdownEditor value={markdown} onChange={setMarkdown} />
        </div>

        {/* Right Panel - BPMN Viewer */}
        <div className="w-1/2 bg-white">
          <BpmnViewer data={bpmnData} />
        </div>
      </div>
    </div>
  );
}