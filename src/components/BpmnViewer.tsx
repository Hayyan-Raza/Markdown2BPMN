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
import {
    User, Settings, Mail, Clock, FileText, AlertCircle,
    MessageSquare, StickyNote, Database
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                Custom Nodes                                */
/* -------------------------------------------------------------------------- */

interface CustomNodeProps extends NodeProps {
    style?: React.CSSProperties;
}

const StartNode = ({ data }: NodeProps) => {
    const subtype = data.subtype || '';
    let Icon = null;
    if (subtype.includes('timer')) Icon = Clock;
    if (subtype.includes('message')) Icon = Mail;
    if (subtype.includes('error')) Icon = AlertCircle;

    return (
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white border border-black shadow-sm flex items-center justify-center relative hover:ring-2 ring-gray-400 transition-all group">
                {Icon && <Icon className="w-5 h-5 text-black" />}
                {/* Handle is now small and invisible until hovered or standard size */}
                <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-transparent !border-none" style={{ right: -5 }} />
            </div>
            {data.label && <div className="text-[11px] text-center mt-1 max-w-[120px] font-medium text-black leading-tight">{data.label}</div>}
        </div>
    );
};

const EndNode = ({ data }: NodeProps) => {
    const subtype = data.subtype || '';
    let Icon = null;
    if (subtype.includes('message')) Icon = Mail;
    if (subtype.includes('error')) Icon = AlertCircle;
    if (subtype.includes('terminate')) Icon = null; // Filled circle usually

    return (
        <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full bg-white border-[3px] border-black shadow-sm flex items-center justify-center relative hover:ring-2 ring-gray-400 transition-all ${subtype.includes('terminate') ? 'bg-black' : ''}`}>
                {Icon && <Icon className="w-5 h-5 text-black" />}
                {subtype.includes('terminate') && <div className="w-full h-full rounded-full bg-black scale-50" />}
                <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-transparent !border-none" style={{ left: -5 }} />
            </div>
            {data.label && <div className="text-[11px] text-center mt-1 max-w-[120px] font-medium text-black leading-tight">{data.label}</div>}
        </div>
    );
};

const TaskNode = ({ data }: NodeProps) => {
    const subtype = data.subtype || 'generic';
    const markers = data.markers || [];
    let Icon = null;

    if (subtype.includes('user')) Icon = User;
    if (subtype.includes('service')) Icon = Settings;
    if (subtype.includes('send') || subtype.includes('receive')) Icon = Mail;
    if (subtype.includes('script')) Icon = FileText;

    // Markers rendering
    const renderMarkers = () => {
        return (
            <div className="flex gap-1 absolute bottom-1 left-1/2 transform -translate-x-1/2">
                {markers.includes('loop') && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <path d="M4 12a8 8 0 0 1 14.93-4" />
                        <path d="M20 8v4h-4" />
                    </svg>
                )}
                {markers.includes('parallel') && (
                    <div className="flex gap-[1px]">
                        <div className="w-[1px] h-2 bg-black"></div>
                        <div className="w-[1px] h-2 bg-black"></div>
                        <div className="w-[1px] h-2 bg-black"></div>
                    </div>
                )}
                {markers.includes('sequential') && (
                    <div className="flex flex-col gap-[1px]">
                        <div className="w-2 h-[1px] bg-black"></div>
                        <div className="w-2 h-[1px] bg-black"></div>
                        <div className="w-2 h-[1px] bg-black"></div>
                    </div>
                )}
                {markers.includes('compensation') && (
                    <div className="flex text-[8px] font-bold leading-none text-black">{'<<'}</div>
                )}
            </div>
        )
    };

    return (
        <div className="w-[120px] h-[70px] bg-white border border-black rounded-[10px] shadow-sm relative hover:ring-1 ring-gray-500 transition-all flex flex-col items-center justify-center p-2 group">
            {/* Type Icon */}
            {Icon && (
                <div className="absolute top-1 left-1">
                    <Icon className="w-3.5 h-3.5 text-black" />
                </div>
            )}

            <div className="text-[11px] font-medium text-black text-center line-clamp-3 leading-tight w-full">
                {data.label}
            </div>

            {/* Markers */}
            {renderMarkers()}

            <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-transparent !border-none" style={{ left: -3 }} />
            <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-transparent !border-none" style={{ right: -3 }} />
        </div>
    );
};

const GatewayNode = ({ data }: NodeProps) => {
    const type = data.subtype || 'xor'; // Use subtype for the variant (xor, and, etc.)

    // SVG Paths for markers
    const renderMarker = () => {
        if (type === 'and' || type === 'parallel') return <path d="M 25 10 V 40 M 10 25 H 40" stroke="black" strokeWidth="3" />;
        if (type === 'or' || type === 'inclusive') return <circle cx="25" cy="25" r="10" stroke="black" strokeWidth="2" fill="none" />;
        if (type === 'complex') return <path d="M 12 12 L 38 38 M 38 12 L 12 38 M 25 10 V 40 M 10 25 H 40" stroke="black" strokeWidth="2" />;
        if (type.includes('event')) return (
            <>
                <circle cx="25" cy="25" r="11" stroke="black" strokeWidth="1" fill="none" />
                <circle cx="25" cy="25" r="8" stroke="black" strokeWidth="1" fill="none" />
                <path d="M 25 25 L 30 20 L 35 25 L 30 30 Z" fill="none" stroke="black" /> {/* Simplify event icon inside */}
            </>
        );
        // XOR (Default or X)
        if (type === 'xor' || type === 'exclusive') return <path d="M 18 18 L 32 32 M 32 18 L 18 32" stroke="black" strokeWidth="2" />;
        return null;
    };

    return (
        <div className="relative w-[50px] h-[50px] group flex items-center justify-center">
            {/* Diamond Shape via SVG */}
            <svg width="50" height="50" viewBox="0 0 50 50" className="absolute top-0 left-0 overflow-visible">
                <path d="M 25 0 L 50 25 L 25 50 L 0 25 Z" fill="white" stroke="black" strokeWidth="1" />
                {renderMarker()}
            </svg>

            {/* Handles - positioned roughly at diamond tips */}
            <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-transparent !border-none" style={{ left: 0, top: 25 }} />
            <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-transparent !border-none" style={{ right: 0, top: 25 }} />
            <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-transparent !border-none" style={{ left: 25, top: 0 }} />
            <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-transparent !border-none" style={{ left: 25, bottom: 0 }} />

            {data.label && (
                <div className="absolute top-14 w-24 text-center pointer-events-none">
                    <div className="text-[10px] text-black bg-white/80 px-1 rounded">{data.label}</div>
                </div>
            )}
        </div>
    );
};

const DataNode = ({ data }: NodeProps) => {
    return (
        <div className="relative w-[40px] h-[50px] group">
            {/* Document Shape */}
            <svg width="40" height="50" viewBox="0 0 40 50" className="drop-shadow-sm">
                <path d="M 0 0 L 25 0 L 40 15 L 40 50 L 0 50 Z" fill="#475569" stroke="black" strokeWidth="1.2" />
                <path d="M 25 0 L 25 15 L 40 15" fill="#cbd5e1" stroke="black" strokeWidth="1.2" />
                {/* Optional Database/File icon inside? */}
            </svg>

            <div className="absolute top-6 w-full flex justify-center">
                <Database className="w-3 h-3 text-white opacity-50" />
            </div>

            <Handle type="target" position={Position.Top} className="!w-full !h-1 !bg-transparent !border-none" />
            <Handle type="source" position={Position.Top} className="!w-full !h-1 !bg-transparent !border-none" />
            <div className="absolute top-[52px] w-24 left-1/2 -translate-x-1/2 text-center">
                <div className="text-[10px] text-black leading-tight">{data.label}</div>
            </div>
        </div>
    );
};

const AnnotationNode = ({ data }: NodeProps) => {
    return (
        <div className="relative flex items-center">
            {/* Open Bracket Shape */}
            <svg width="10" height="40" viewBox="0 0 10 40" className="mr-1 flex-shrink-0">
                <path d="M 8 0 L 0 0 L 0 40 L 8 40" fill="none" stroke="black" strokeWidth="1.5" />
            </svg>
            <div className="text-[11px] text-gray-700 italic leading-snug max-w-[140px]">
                {data.label}
            </div>
            {/* Annotation association handle */}
            <Handle type="target" position={Position.Left} className="!w-1 !h-1 !bg-transparent !opacity-0 !border-none !left-0" />
        </div>
    );
};

const PoolNode = ({ data, selected, style }: CustomNodeProps) => {
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
            </div>
        </>
    );
};

const LaneNode = ({ data, selected, style }: CustomNodeProps) => {
    return (
        <>
            <NodeResizer minWidth={50} minHeight={50} isVisible={selected} lineClassName="border-blue-400" handleClassName="h-3 w-3 bg-white border border-blue-400 rounded" />
            <div
                className="h-full border-b border-black relative bg-transparent"
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
    dataObject: DataNode,
    annotation: AnnotationNode,
};

/* -------------------------------------------------------------------------- */
/*                                Layout Logic                                */
/* -------------------------------------------------------------------------- */

const getHandleOffset = (type: string, subtype: string = '') => {
    if (type === 'start' || type === 'end') return 20; // Center of 40px circle
    if (type === 'task') return 35; // Center of 70px box
    if (type === 'gateway') return 25; // Center of 50px diamond
    if (type === 'dataObject') return 25; // Center of 50px icon
    return 30; // Default
};

const getStrictLayout = (nodes: any[], edges: any[], pools: any[], lanes: any[], dataObjects: any[] = [], annotations: any[] = []) => {
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
            return `pool-root-${p.name}`; // Marker for root pool content
        }
        return 'default';
    }

    // Combine all content nodes
    const contentNodes = [
        ...nodes.filter(n => !['pool', 'lane'].includes(n.type)),
        ...dataObjects.map(d => ({ ...d, type: 'dataObject' })),
        ...annotations.map(a => ({ ...a, type: 'annotation' }))
    ];

    contentNodes.forEach(node => {
        const rawPool = node.pool;
        let laneId = resolveLaneId(rawPool);
        // Fallback: If unresolved or 'default', but we have lanes, put in first lane?
        if (laneId === 'default' && lanes.length > 0) laneId = `lane-${lanes[0].pool}-${lanes[0].name}`;

        elementToLane[node.id] = laneId;
        if (!laneGroups[laneId]) laneGroups[laneId] = [];
        laneGroups[laneId].push(node);
    });

    // 2. Run Dagre on Content ONLY to get X-Flow
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 50, ranker: 'network-simplex' });

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
    const GRID_WIDTH = Math.max(globalMaxX + 100, 600); // Tighter width, min 600px

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

                // 3.1 Identify Bounding Box of Siblings in Dagre Y Space
                let minDy = Infinity;
                let maxDy = -Infinity;
                siblings.forEach(node => {
                    const dn = dagreGraph.node(node.id);
                    if (dn.y < minDy) minDy = dn.y;
                    if (dn.y > maxDy) maxDy = dn.y;
                });

                // If no siblings, use defaults
                if (minDy === Infinity) { minDy = 0; maxDy = 0; }


                const groupHeight = maxDy - minDy;
                // Padding: 80px base + (Group spread).
                // Ensure at least 120px to avoid cramping
                const LANE_HEIGHT = Math.max(120, groupHeight + 80);

                // Add Lane Node
                layoutNodes.push({
                    id: laneId,
                    type: 'lane',
                    data: { label: lane.name },
                    position: { x: 40, y: poolHeight }, // Relative to Pool, stacked vertically
                    style: { width: GRID_WIDTH, height: LANE_HEIGHT },
                    parentNode: poolNodeId,
                });

                // 3.2 Position Children relative to Lane
                // Center the group within the Lane Height
                const groupCenterY = (minDy + maxDy) / 2;
                const laneCenterY = LANE_HEIGHT / 2;

                siblings.forEach(node => {
                    const dNode = dagreGraph.node(node.id);

                    // Relative Y from group center
                    const relativeY = dNode.y - groupCenterY;

                    // Target Absolute Y in Lane
                    let targetY = laneCenterY + relativeY;

                    // Apply Handle Offset CORRECTION
                    // We want the HANDLE to be at targetY (if we assume targetY is the ideal "wire" line)
                    // But if we have parallel paths, 'targetY' varies.
                    // We still want to correct for node shape.
                    const offset = getHandleOffset(node.type, node.subtype);
                    const y = targetY - offset;

                    layoutNodes.push({
                        id: node.id,
                        type: node.type,
                        data: { label: node.name, type: node.type, subtype: node.subtype },
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
                // Center Y: Align Handles to Pool Center
                const offset = getHandleOffset(node.type, node.subtype);
                const y = (POOL_HEIGHT / 2) - offset;

                layoutNodes.push({
                    id: node.id,
                    type: node.type,
                    data: { label: node.name, type: node.type, subtype: node.subtype },
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
            style: { width: GRID_WIDTH + 40, height: poolHeight, zIndex: -1 }, // +Header width
            className: 'z-0',
        });

        currentY += poolHeight + 50; // Gap between pools
        renderedPools.add(pool.name);
    });

    // Handle Implicit/Default Pool (for orphan nodes)
    // If 'default' group has content
    if (laneGroups['default'] && laneGroups['default'].length > 0) {
        // Create an "Implicit" pool logic could go here, omitting for brevity in this step
    }

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
        const result = getStrictLayout(
            data.tasks.concat(data.gateways),
            data.flows,
            data.pools,
            data.lanes,
            data.dataObjects || [],
            data.annotations || []
        );

        // Edges (Construct here to ensure consistent IDs)
        const renderEdges = data.flows.map((f: any, idx: number) => {
            const isMessage = f.type === 'message';
            const isAssociation = f.type === 'association';

            // Gateway Logic: Route True/False paths
            let sourceHandle = undefined;
            const sourceIsGateway = data.gateways.find((g: any) => g.id === f.from);

            if (sourceIsGateway) {
                const lowerLabel = f.label ? f.label.toLowerCase() : '';
                // Standard: Yes/True = Main Flow (Right), No/False = Exception/Branch (Bottom)
                // This uncrosses the lines when Layout places Main Top and Exception Bottom
                if (lowerLabel === 'true' || lowerLabel === 'yes') sourceHandle = 'source-right';
                else if (lowerLabel === 'false' || lowerLabel === 'no') sourceHandle = 'source-bottom';
                else sourceHandle = 'source-right';
            }

            return {
                id: `e${idx}`,
                source: f.from,
                target: f.to,
                sourceHandle,
                label: f.label,
                type: 'step',
                markerEnd: isAssociation ? undefined : { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#000' },
                style: {
                    stroke: '#000',
                    strokeWidth: 1.5,
                    strokeDasharray: isMessage ? '5,5' : isAssociation ? '2,2' : undefined
                },
                labelStyle: { fill: '#000', fontWeight: 700, strokeWidth: 0 },
                labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
                zIndex: 20,
            };
        });

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
                    preventScrolling={false}
                    elevateNodesOnSelect={false}
                    snapToGrid={true}
                    snapGrid={[5, 5]}
                    attributionPosition="bottom-right"
                >
                    <Background color="#cbd5e1" gap={20} size={1} />
                    <Controls />

                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
