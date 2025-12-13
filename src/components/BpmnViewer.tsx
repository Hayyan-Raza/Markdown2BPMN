import { useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    MarkerType,
    NodeProps,
    ReactFlowProvider,
    addEdge,
    Connection,
    Edge,
    Panel,
    NodeResizer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

/* -------------------------------------------------------------------------- */
/*                                Custom Nodes                                */
/* -------------------------------------------------------------------------- */

interface CustomNodeProps extends NodeProps {
    style?: React.CSSProperties;
}

const StartNode = ({ data }: NodeProps) => {
    return (
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white border border-black shadow-sm flex items-center justify-center relative hover:ring-2 ring-gray-400 transition-all">
                <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-full !h-full !top-0 !left-0 !transform-none !rounded-full" />
            </div>
            {data.label && <div className="text-[11px] text-center mt-1 max-w-[120px] font-medium text-black leading-tight">{data.label}</div>}
        </div>
    );
};

const EndNode = ({ data }: NodeProps) => {
    return (
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white border-[3px] border-black shadow-sm flex items-center justify-center relative hover:ring-2 ring-gray-400 transition-all">
                <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-full !h-full !top-0 !left-0 !transform-none !rounded-full" />
            </div>
            {data.label && <div className="text-[11px] text-center mt-1 max-w-[120px] font-medium text-black leading-tight">{data.label}</div>}
        </div>
    );
};

const TaskNode = ({ data }: NodeProps) => {
    return (
        <div className="px-4 py-2 bg-white border border-black rounded-lg shadow-sm min-w-[120px] text-center relative hover:ring-1 ring-gray-500 transition-all group">
            <Handle type="target" position={Position.Left} className="!w-1 !h-1 !bg-black" />
            <div className="text-xs font-medium text-black line-clamp-2">{data.label}</div>
            <Handle type="source" position={Position.Right} className="!w-1 !h-1 !bg-black" />
        </div>
    );
};

const GatewayNode = ({ data }: NodeProps) => {
    return (
        <div className="flex flex-col items-center justify-center w-14 h-14 relative group">
            <Handle type="target" position={Position.Left} className="!bg-transparent !border-none z-10 !w-1 !h-1 !left-2" />
            <div className="w-10 h-10 bg-white border border-black rotate-45 shadow-sm flex items-center justify-center hover:ring-1 ring-gray-500 transition-all">
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-black mt-0.5">{data.type === 'and' ? '+' : data.type === 'xor' ? 'X' : ''}</span>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-transparent !border-none z-10 !w-1 !h-1 !right-2" />
            <Handle type="source" position={Position.Top} className="!bg-transparent !border-none z-10 !w-1 !h-1 !top-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none z-10 !w-1 !h-1 !bottom-2" />

            {data.label && (
                <div className="absolute top-12 w-32 text-center pointer-events-none">
                    <div className="text-[10px] text-black bg-white/90 px-1 rounded border border-gray-100">{data.label}</div>
                </div>
            )}
        </div>
    );
};

const PoolNode = ({ data, selected, style }: CustomNodeProps) => {
    // Pool logic: Only render Header. The body is transparent/container.
    // Actually, we want a border around the whole thing.
    return (
        <>
            <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineClassName="border-blue-400" handleClassName="h-3 w-3 bg-white border border-blue-400 rounded" />
            <div
                className="h-full border-2 border-black bg-white rounded overflow-hidden flex relative"
                style={{ width: '100%', height: '100%' }}
            >
                <div className="w-10 h-full bg-slate-50 border-r-2 border-black flex items-center justify-center shrink-0">
                    <div className="transform -rotate-90 whitespace-nowrap text-black font-bold text-sm tracking-wide">
                        {data.label}
                    </div>
                </div>
                {/* Child Lanes track their own borders */}
            </div>
        </>
    );
};

const LaneNode = ({ data, selected, style }: CustomNodeProps) => {
    return (
        <>
            <NodeResizer minWidth={50} minHeight={50} isVisible={selected} lineClassName="border-blue-400" handleClassName="h-3 w-3 bg-white border border-blue-400 rounded" />
            <div
                className="h-full border-b border-black relative bg-transparent last:border-b-0"
                style={{ width: '100%', height: '100%' }}
            >
                <div className="absolute top-0 bottom-0 left-0 w-8 border-r border-black bg-slate-50/20 flex items-center justify-center">
                    <div className="transform -rotate-90 whitespace-nowrap text-xs text-black font-medium">
                        {data.label}
                    </div>
                </div>
            </div>
        </>
    );
};

const nodeTypes = {
    start: StartNode,
    end: EndNode,
    task: TaskNode,
    gateway: GatewayNode,
    pool: PoolNode,
    lane: LaneNode,
};

/* -------------------------------------------------------------------------- */
/*                                Layout Logic                                */
/* -------------------------------------------------------------------------- */

const getStrictLayout = (nodes: any[], edges: any[], pools: any[], lanes: any[]) => {
    // 1. Group Elements by ID -> ContainerID
    // Hierarchy: Pool -> Lane -> Element
    // We need to resolve Element -> Lane.
    const elementToLane: Record<string, string> = {};
    const laneGroups: Record<string, any[]> = {}; // laneId -> [nodes]

    // Initialize groups for all lanes
    lanes.forEach(l => {
        const id = `lane-${l.pool}-${l.name}`;
        laneGroups[id] = [];
    });
    // Add default group if needed?
    laneGroups['default'] = [];

    // Helper to resolve parent
    const resolveLaneId = (itemPool: string) => {
        // Try strict lane match
        const l = lanes.find(x => x.name === itemPool);
        if (l) return `lane-${l.pool}-${l.name}`;

        // Try pool match -> first lane
        const p = pools.find(x => x.name === itemPool);
        if (p) {
            const pLanes = lanes.filter(x => x.pool === p.name);
            if (pLanes.length > 0) return `lane-${pLanes[0].pool}-${pLanes[0].name}`;
            // If pool has no lanes, it acts as a lane itself? 
            // We'll map it to a "synthetic" lane key or just return pool id?
            // Strict Grid: Pools MUST have lanes effectively. If empty, create 1 implicitly?
            return `pool-root-${p.name}`; // Marker for root pool content
        }
        return 'default';
    }

    const contentNodes = nodes.filter(n => !['pool', 'lane'].includes(n.type));

    contentNodes.forEach(node => {
        const rawPool = node.pool; // Fix: Access direct property, not node.data
        let laneId = resolveLaneId(rawPool);
        // Fix: If unresolved or 'default', but we have lanes, put in first lane?
        if (laneId === 'default' && lanes.length > 0) laneId = `lane-${lanes[0].pool}-${lanes[0].name}`;

        elementToLane[node.id] = laneId;
        if (!laneGroups[laneId]) laneGroups[laneId] = [];
        laneGroups[laneId].push(node);
    });

    // 2. Run Dagre on Content ONLY to get X-Flow
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 60 });

    contentNodes.forEach(node => {
        let w = 140, h = 60;
        if (node.type === 'gateway') { w = 60; h = 60; }
        if (node.type === 'start' || node.type === 'end') { w = 50; h = 50; }
        dagreGraph.setNode(node.id, { width: w, height: h });
    });

    edges.forEach(edge => {
        // Fix: accessing raw flow objects which have 'from' and 'to'
        const s = contentNodes.find(n => n.id === edge.from);
        const t = contentNodes.find(n => n.id === edge.to);
        if (s && t) dagreGraph.setEdge(edge.from, edge.to);
    });

    dagre.layout(dagreGraph);

    // 3. Compute Dimensions per Lane
    // Grid Logic:
    // All Lanes have same Width (Max Content X).
    // Lanes stacked Vertically.

    let globalMaxX = 0;
    // Calculate global max X first
    contentNodes.forEach(node => {
        const dNode = dagreGraph.node(node.id);
        const rightEdge = dNode.x + dNode.width / 2;
        if (rightEdge > globalMaxX) globalMaxX = rightEdge;
    });

    // Add Padding
    const GRID_WIDTH = Math.max(globalMaxX + 200, 800); // Minimum 800px width

    // Compute Y-Stack
    let currentY = 0;
    const POOL_PADDING = 40;
    const LANE_MIN_HEIGHT = 150;

    // We need to iterate Pools -> Lanes in Order
    const layoutNodes: any[] = [];

    // Handle "Default" items if any (orphans)
    // Merge them into a "General" pool?

    const renderedPools = new Set<string>();

    pools.forEach(pool => {
        const pLanes = lanes.filter(l => l.pool === pool.name);
        // If pool has lines, stack them.

        let poolStartY = currentY;
        let poolHeight = 0;

        // Construct Pool Node (Placeholder, updated later)
        const poolNodeId = `pool-${pool.name}`;

        if (pLanes.length > 0) {
            pLanes.forEach(lane => {
                const laneId = `lane-${lane.pool}-${lane.name}`;
                const siblings = laneGroups[laneId] || [];

                // Calculate Lane Height based on content Y range from Dagre?
                // Problem: Dagre Y is global. If we use it, we get messy scatter.
                // Solution: We only use Dagre X.
                // We center items vertically in the lane? 
                // OR we can run a mini-dagre per lane? 
                // Simple: Center items Y=Height/2.
                // Advanced: Determine collision.
                // For now: Fixed Height or simple collision check. 
                // Let's use simple Center Y + Jitter if overlaps?
                // ACTUALLY: Let's use Dagre's rank Y relative to the group?
                // Hard to extract.

                // Simplest Robost Strategy:
                // Lane Height = Auto-expand if many nodes? 
                // Let's stick to fixed height (180px) per lane for cleanliness
                // unless nodes stack?
                // Let's assume single row per lane for MVP "Grid".

                const LANE_HEIGHT = 180;

                // Add Lane Node
                layoutNodes.push({
                    id: laneId,
                    type: 'lane',
                    data: { label: lane.name },
                    position: { x: 0, y: 0 }, // Relative to Pool
                    style: { width: GRID_WIDTH, height: LANE_HEIGHT },
                    parentNode: poolNodeId,
                });

                // Position Children relative to Lane
                siblings.forEach(node => {
                    const dNode = dagreGraph.node(node.id);
                    // X comes from Global Flow (Dagre).
                    // Y is centered in Lane.

                    // Correction: Dagre X is based on global structure. Perfect.
                    // Center Y:
                    const y = (LANE_HEIGHT - dNode.height) / 2;

                    layoutNodes.push({
                        id: node.id,
                        type: node.type,
                        data: { label: node.name, type: node.type },
                        position: { x: dNode.x, y }, // Relative to Lane
                        parentNode: laneId,
                        className: 'z-10',
                        style: { zIndex: 10 }
                    });
                });

                poolHeight += LANE_HEIGHT;
            });
        } else {
            // Pool without lanes (Content direct child)
            const rootId = `pool-root-${pool.name}`;
            const children = laneGroups[rootId] || []; // Mapped earlier
            const POOL_HEIGHT = 200;
            poolHeight = POOL_HEIGHT;

            children.forEach(node => {
                const dNode = dagreGraph.node(node.id);
                const y = (POOL_HEIGHT - dNode.height) / 2;
                layoutNodes.push({
                    id: node.id,
                    type: node.type,
                    data: { label: node.name, type: node.type },
                    position: { x: dNode.x, y },
                    parentNode: poolNodeId,
                    className: 'z-10',
                    style: { zIndex: 10 }
                });
            });
        }

        // Add Pool Node
        layoutNodes.push({
            id: poolNodeId,
            type: 'pool',
            data: { label: pool.name },
            position: { x: 0, y: currentY }, // Absolute Y Stack
            style: { width: GRID_WIDTH + 40, height: poolHeight }, // +Header width
            className: 'z-0',
        });

        currentY += poolHeight + 50; // Gap between pools
        renderedPools.add(pool.name);
    });

    // Handle Implicit/Default Pool (for orphan nodes)
    // If 'default' group has content
    if (laneGroups['default'] && laneGroups['default'].length > 0) {
        // Create an "Implicit" pool
        // Similar logic...
    }

    // Edges
    // No change needed to edges mostly.

    return { nodes: layoutNodes, edges };
};


/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

interface BpmnViewerProps {
    data: any;
}

export function BpmnViewer({ data }: BpmnViewerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    useEffect(() => {
        if (!data) return;

        // Use Strict Layout
        const result = getStrictLayout(data.tasks.concat(data.gateways), data.flows, data.pools, data.lanes);

        // Edges (Construct here to ensure consistent IDs)
        const renderEdges = data.flows.map((f: any, idx: number) => ({
            id: `e${idx}`,
            source: f.from,
            target: f.to,
            label: f.label,
            type: 'step',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#000' },
            style: { stroke: '#000', strokeWidth: 1.5 },
            labelStyle: { fill: '#000', fontWeight: 700, strokeWidth: 0 },
            labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
            zIndex: 20,
        }));

        setNodes(result.nodes);
        setEdges(renderEdges);

    }, [data, setNodes, setEdges]);

    const onNodeDragStop = (event: any, node: any) => { };

    if (!data) return null;

    return (
        <div className="h-full w-full bg-slate-50 relative group">
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeDragStop={onNodeDragStop}
                    fitView
                    minZoom={0.2}
                    maxZoom={4}
                    snapToGrid={true}
                    snapGrid={[10, 10]}
                    attributionPosition="bottom-right"
                >
                    <Background color="#cbd5e1" gap={20} size={1} />
                    <Controls />
                    <Panel position="top-right" className="bg-white p-2 rounded shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500 font-medium">Strict Grid Layout</div>
                    </Panel>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
