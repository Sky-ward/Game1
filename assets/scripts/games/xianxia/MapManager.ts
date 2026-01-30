import { RNG } from '../../framework/RNG';

export type NodeType = 'battle' | 'event' | 'shop' | 'elite' | 'boss';

export interface MapNode {
    type: NodeType;
}

export class MapManager {
    static generate(seed: number): MapNode[][] {
        const rng = new RNG(seed);
        const acts: MapNode[][] = [];
        const baseTypes: NodeType[] = ['battle', 'event', 'shop', 'battle', 'elite'];
        for (let act = 0; act < 3; act++) {
            const nodes: MapNode[] = [];
            for (let i = 0; i < 5; i++) {
                const type = baseTypes[i];
                nodes.push({ type });
            }
            nodes[4] = { type: act === 2 ? 'boss' : 'elite' };
            if (rng.next() > 0.5) {
                [nodes[1], nodes[2]] = [nodes[2], nodes[1]];
            }
            acts.push(nodes);
        }
        return acts;
    }
}
