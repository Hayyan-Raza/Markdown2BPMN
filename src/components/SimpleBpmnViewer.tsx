import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface SimpleBpmnViewerProps {
  markdown: string;
  onError: (error: string | null) => void;
}

export function SimpleBpmnViewer({ markdown, onError }: SimpleBpmnViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [elements, setElements] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed = parseMarkdown(markdown);
        setElements(parsed);
        onError(null);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to parse diagram');
        setElements(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [markdown, onError]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Viewer Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-gray-900">BPMN Diagram</h2>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
          <span className="text-gray-600 text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.25)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-2"
            title="Reset view"
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Diagram Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div 
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s'
          }}
        >
          {elements && <DiagramRenderer elements={elements} />}
        </div>
      </div>
    </div>
  );
}

function DiagramRenderer({ elements }: { elements: any }) {
  const { pools, lanes, tasks, gateways, flows } = elements;

  return (
    <div className="inline-block min-w-max">
      {/* Render Pools */}
      {pools.map((pool: any, poolIdx: number) => {
        const poolLanes = lanes.filter((l: any) => l.pool === pool.name);
        
        return (
          <div key={poolIdx} className="mb-8 border-2 border-blue-600 rounded-lg overflow-hidden">
            {/* Pool Header */}
            <div className="flex">
              <div className="w-12 bg-blue-600 flex items-center justify-center">
                <div className="transform -rotate-90 whitespace-nowrap text-white py-4">
                  {pool.name}
                </div>
              </div>
              
              {/* Lanes */}
              <div className="flex-1">
                {poolLanes.map((lane: any, laneIdx: number) => (
                  <div 
                    key={laneIdx} 
                    className={`p-4 min-h-[200px] ${laneIdx > 0 ? 'border-t border-gray-300' : ''}`}
                  >
                    <div className="text-gray-600 mb-4">{lane.name}</div>
                    
                    {/* Tasks in this lane */}
                    <div className="flex flex-wrap gap-4">
                      {tasks
                        .filter((t: any) => t.pool === pool.name || t.pool === lane.name)
                        .map((task: any, taskIdx: number) => (
                          <TaskElement key={taskIdx} task={task} />
                        ))}
                      
                      {gateways
                        .filter((g: any) => g.pool === pool.name || g.pool === lane.name)
                        .map((gateway: any, gwIdx: number) => (
                          <GatewayElement key={gwIdx} gateway={gateway} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Flow connections info */}
      {flows.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-gray-900 mb-2">Sequence Flows:</h3>
          <div className="space-y-1">
            {flows.map((flow: any, idx: number) => (
              <div key={idx} className="text-sm text-gray-600">
                {flow.from} → {flow.to}
                {flow.label && <span className="text-blue-600 ml-2">[{flow.label}]</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskElement({ task }: { task: any }) {
  if (task.type === 'start' || task.type === 'end') {
    return (
      <div className="flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
          task.type === 'start' 
            ? 'bg-green-100 border-green-600' 
            : 'bg-red-100 border-red-600'
        }`}>
          <span className="text-xs text-center">{task.type}</span>
        </div>
        <div className="text-xs text-gray-600 mt-1 text-center max-w-[100px]">{task.name}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="px-4 py-3 bg-white border-2 border-blue-500 rounded-lg min-w-[120px] max-w-[200px]">
        <div className="text-sm text-gray-800 text-center">{task.name}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">{task.id}</div>
    </div>
  );
}

function GatewayElement({ gateway }: { gateway: any }) {
  const symbol = gateway.type === 'xor' ? 'X' : gateway.type === 'and' ? '+' : 'O';
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rotate-45 bg-yellow-100 border-4 border-yellow-600"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl text-yellow-800">
          {symbol}
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-1 text-center max-w-[120px]">{gateway.name}</div>
      <div className="text-xs text-gray-500">{gateway.id}</div>
    </div>
  );
}

// Simple parser
function parseMarkdown(markdown: string) {
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
  
  const pools: any[] = [];
  const lanes: any[] = [];
  const tasks: any[] = [];
  const gateways: any[] = [];
  const flows: any[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith('#')) return;

    if (line.startsWith('pool:')) {
      pools.push({ name: line.substring(5).trim() });
    } else if (line.startsWith('lane:')) {
      const content = line.substring(5).trim();
      const [pool, name] = content.split('>').map(s => s.trim());
      if (pool && name) lanes.push({ pool, name });
    } else if (line.startsWith('task:')) {
      const content = line.substring(5).trim();
      const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+(.+)$/);
      if (match) {
        const [, id, pool, name] = match;
        const type = id === 'start' ? 'start' : id === 'end' ? 'end' : 'task';
        tasks.push({ id, pool, name, type });
      }
    } else if (line.startsWith('gateway:')) {
      const content = line.substring(8).trim();
      const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+([^(]+)\((\w+)\)$/);
      if (match) {
        const [, id, pool, name, type] = match;
        gateways.push({ id, pool, name: name.trim(), type });
      }
    } else if (line.startsWith('flow:')) {
      const content = line.substring(5).trim();
      const match = content.match(/^(\w+)\s*->\s*(\w+)(?:\s+\[([^\]]+)\])?$/);
      if (match) {
        const [, from, to, label] = match;
        flows.push({ from, to, label: label?.trim() });
      }
    }
  });

  return { pools, lanes, tasks, gateways, flows };
}
