import { Config } from '../../framework/Config';

export interface DiscipleConfig {
    id: number;
    name: string;
    rarity: number;
    tags: string[];
    baseStats: { hp: number; atk: number; speed: number };
    skill: { desc: string; params: Record<string, number> };
    upgrade: { level2: Record<string, number>; level3: Record<string, number>; mechanic: string };
    shopWeight: number;
}

export interface SynergyConfig {
    id: string;
    name: string;
    tiers: { count: number; effects: Record<string, number>; desc: string }[];
}

export interface HexConfig {
    id: number;
    name: string;
    category: string;
    rarity: number;
    weight: number;
    desc: string;
    tags: string[];
    stackRule: string;
}

export interface ArtifactConfig {
    id: number;
    name: string;
    recipe: string[];
    trigger: string;
    effect: { desc: string; params: Record<string, number> };
    rarity: number;
}

export interface BattleReport {
    result: '胜利' | '失败';
    detail: string;
}

export class BattleManager {
    static simulate(
        team: DiscipleConfig[],
        hexes: HexConfig[],
        artifacts: ArtifactConfig[],
        actIndex: number,
        nodeType: string
    ): BattleReport {
        const synergies = Config.get<SynergyConfig[]>('synergies');
        const tagCounts: Record<string, number> = {};
        team.forEach((disciple) => {
            disciple.tags.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
            });
        });

        let power = team.reduce((sum, disciple) => sum + disciple.baseStats.atk + disciple.baseStats.hp * 0.2, 0);
        let hp = team.reduce((sum, disciple) => sum + disciple.baseStats.hp, 0);

        synergies.forEach((syn) => {
            const count = tagCounts[syn.id] ?? 0;
            syn.tiers.forEach((tier) => {
                if (count >= tier.count) {
                    power += tier.effects.attackBonus ?? 0;
                    hp += tier.effects.hpBonus ?? 0;
                }
            });
        });

        hexes.forEach((hex) => {
            if (hex.tags.some((tag) => tagCounts[tag])) {
                power += hex.rarity * 5;
            }
        });

        artifacts.forEach((artifact) => {
            power += artifact.rarity * 8;
            hp += artifact.rarity * 10;
        });

        const enemyPower = 60 + actIndex * 40 + (nodeType === 'boss' ? 80 : nodeType === 'elite' ? 40 : 0);
        const enemyHp = 300 + actIndex * 120 + (nodeType === 'boss' ? 200 : nodeType === 'elite' ? 100 : 0);

        const score = power * 1.2 + hp * 0.4 - (enemyPower + enemyHp * 0.3);
        const win = score >= 0;

        return {
            result: win ? '胜利' : '失败',
            detail: `我方战力:${power.toFixed(0)} 生命:${hp.toFixed(0)} | 敌方战力:${enemyPower} 生命:${enemyHp}`,
        };
    }
}
