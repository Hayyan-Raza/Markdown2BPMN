export interface BpmnData {
    pools: Array<{ name: string }>;
    lanes: Array<{ pool: string; name: string }>;
    tasks: Array<{ id: string; pool: string; name: string; type: string; subtype?: string; markers?: string[] }>;
    gateways: Array<{ id: string; pool: string; name: string; type: string; subtype?: string }>;
    dataObjects: Array<{ id: string; pool: string; name: string }>;
    annotations: Array<{ id: string; pool: string; name: string }>;
    flows: Array<{ from: string; to: string; label?: string; type?: string }>;
}

export function parseBpmnMarkdown(markdown: string): BpmnData {
    const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);

    const pools: any[] = [];
    const lanes: any[] = [];
    const tasks: any[] = [];
    const gateways: any[] = [];
    const dataObjects: any[] = [];
    const annotations: any[] = [];
    const flows: any[] = [];

    lines.forEach((line) => {
        // Skip comments
        if (line.startsWith('#')) return;

        if (line.startsWith('pool:')) {
            pools.push({ name: line.substring(5).trim() });
        } else if (line.startsWith('lane:')) {
            const content = line.substring(5).trim();
            if (content.includes('>')) {
                const [pool, name] = content.split('>').map(s => s.trim());
                if (pool && name) lanes.push({ pool, name });
            }
        } else if (line.startsWith('task:')) {
            const content = line.substring(5).trim();
            // Format: task: id [Pool] Description (type, marker)
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+([^(]+)(?:\(([^)]+)\))?$/);
            if (match) {
                const [, id, pool, name, options] = match;

                let subtype = 'user';
                const markers: string[] = [];

                if (options) {
                    const parts = options.split(',').map(s => s.trim().toLowerCase());
                    // Identify subtype vs markers
                    const knownMarkers = ['loop', 'parallel', 'sequential', 'compensation'];

                    parts.forEach(p => {
                        if (knownMarkers.includes(p)) {
                            markers.push(p);
                        } else {
                            subtype = p; // Assume non-marker is the subtype (user, service, etc)
                        }
                    });
                }

                tasks.push({ id, pool, name: name.trim(), type: 'task', subtype, markers });
            } else {
                // Try fallback legacy format
                const legacy = content.match(/^(\w+)\s+\[([^\]]+)\]\s+(.+)$/);
                if (legacy) {
                    const [, id, pool, name] = legacy;
                    tasks.push({ id, pool, name, type: 'task', subtype: 'generic', markers: [] });
                }
            }
        } else if (line.startsWith('event:')) {
            const content = line.substring(6).trim();
            // Format: event: id [Pool] Name (type)
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+([^(]+)(?:\(([^)]+)\))?$/);
            if (match) {
                const [, id, pool, name, subtype] = match;
                // Determine main type (start/end/intermediate) from subtype or ID
                let type = 'intermediate';
                const sub = subtype?.toLowerCase() || '';
                if (sub.includes('start')) type = 'start';
                else if (sub.includes('end')) type = 'end';

                tasks.push({ id, pool, name: name.trim(), type, subtype: sub });
            }
        } else if (line.startsWith('gateway:')) {
            const content = line.substring(8).trim();
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+([^(]+)(?:\(([^)]+)\))?$/);
            if (match) {
                const [, id, pool, name, type] = match;
                gateways.push({ id, pool, name: name.trim(), type: 'gateway', subtype: type || 'xor' });
            }
        } else if (line.startsWith('data:')) {
            const content = line.substring(5).trim();
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+(.+)$/);
            if (match) {
                const [, id, pool, name] = match;
                dataObjects.push({ id, pool, name: name.trim() });
            }
        } else if (line.startsWith('note:')) {
            const content = line.substring(5).trim();
            const match = content.match(/^(\w+)\s+\[([^\]]+)\]\s+(.+)$/);
            if (match) {
                const [, id, pool, name] = match;
                annotations.push({ id, pool, name: name.trim() });
            }
        } else if (line.startsWith('flow:')) {
            const content = line.substring(5).trim();
            // Detect arrow type: -> (process), --> (message), ..> (association)
            let type = 'sequence';
            let flowMatch = content.match(/^(\w+)\s*(-{1,2}>|\.\.>)\s*(\w+)(?:\s+\[([^\]]+)\])?$/);

            if (flowMatch) {
                const [, from, arrow, to, label] = flowMatch;
                if (arrow === '-->') type = 'message';
                if (arrow === '..>') type = 'association';
                flows.push({ from, to, label: label?.trim(), type });
            }
        }
    });

    return { pools, lanes, tasks, gateways, dataObjects, annotations, flows };
}
