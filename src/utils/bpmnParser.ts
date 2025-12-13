
export interface BpmnData {
    pools: Array<{ name: string }>;
    lanes: Array<{ pool: string; name: string }>;
    tasks: Array<{ id: string; pool: string; name: string; type: string }>;
    gateways: Array<{ id: string; pool: string; name: string; type: string }>;
    flows: Array<{ from: string; to: string; label?: string }>;
}

export function parseBpmnMarkdown(markdown: string): BpmnData {
    const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);

    const pools: any[] = [];
    const lanes: any[] = [];
    const tasks: any[] = [];
    const gateways: any[] = [];
    const flows: any[] = [];

    lines.forEach((line) => {
        // Skip comments
        if (line.startsWith('#')) return;

        if (line.startsWith('pool:')) {
            pools.push({ name: line.substring(5).trim() });
        } else if (line.startsWith('lane:')) {
            const content = line.substring(5).trim();
            // Handle "Pool > Lane" format
            if (content.includes('>')) {
                const [pool, name] = content.split('>').map(s => s.trim());
                if (pool && name) lanes.push({ pool, name });
            } else {
                // Fallback or ignore if format is invalid
            }
        } else if (line.startsWith('task:')) {
            const content = line.substring(5).trim();
            // Format: task: id [Pool] Description
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+(.+)$/);
            if (match) {
                const [, id, pool, name] = match;
                const type = id === 'start' ? 'start' : id === 'end' ? 'end' : 'task';
                tasks.push({ id, pool, name, type });
            }
        } else if (line.startsWith('gateway:')) {
            const content = line.substring(8).trim();
            // Format: gateway: id [Pool] Description (type)
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+([^(]+)\((\w+)\)$/);
            if (match) {
                const [, id, pool, name, type] = match;
                gateways.push({ id, pool, name: name.trim(), type });
            }
        } else if (line.startsWith('flow:')) {
            const content = line.substring(5).trim();
            // Format: flow: from -> to [label]
            // or: flow: from -> to
            const match = content.match(/^(\w+)\s*->\s*(\w+)(?:\s+\[([^\]]+)\])?$/);
            if (match) {
                const [, from, to, label] = match;
                flows.push({ from, to, label: label?.trim() });
            }
        }
    });

    return { pools, lanes, tasks, gateways, flows };
}
