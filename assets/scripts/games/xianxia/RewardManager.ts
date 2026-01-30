import { RNG } from '../../framework/RNG';
import { DiscipleConfig, HexConfig, ArtifactConfig } from './BattleManager';

export type RewardType = 'disciple' | 'hex' | 'artifact';

export interface RewardOption {
    type: RewardType;
    name: string;
    payloadId: number;
}

export class RewardManager {
    constructor(private rng: RNG) {}

    generateRewards(
        disciples: DiscipleConfig[],
        hexes: HexConfig[],
        artifacts: ArtifactConfig[]
    ): RewardOption[] {
        const rewards: RewardOption[] = [];
        const pools: RewardType[] = ['disciple', 'hex', 'artifact'];
        for (let i = 0; i < 3; i++) {
            const type = pools[i];
            if (type === 'disciple') {
                const disciple = this.rng.pickWeighted(disciples.map((d) => ({ ...d, weight: d.shopWeight })));
                rewards.push({ type, name: disciple.name, payloadId: disciple.id });
            } else if (type === 'hex') {
                const hex = this.rng.pickWeighted(hexes);
                rewards.push({ type, name: hex.name, payloadId: hex.id });
            } else {
                const artifact = this.rng.pickWeighted(artifacts.map((a) => ({ ...a, weight: a.rarity })));
                rewards.push({ type, name: artifact.name, payloadId: artifact.id });
            }
        }
        return rewards;
    }
}
