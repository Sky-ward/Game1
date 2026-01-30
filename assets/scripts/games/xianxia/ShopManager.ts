import { RNG } from '../../framework/RNG';
import { DiscipleConfig } from './BattleManager';

export interface ShopItem {
    id: number;
    name: string;
    price: number;
    tags: string[];
}

export interface ShopSnapshot {
    items: ShopItem[];
}

export class ShopManager {
    private pity: Record<string, number> = {};

    constructor(private rng: RNG) {}

    generateShop(disciples: DiscipleConfig[], actIndex: number, activeTags: string[]): ShopSnapshot {
        const items: ShopItem[] = [];
        const boosted = disciples.map((disciple) => {
            const missCount = activeTags.reduce((max, tag) => {
                if (disciple.tags.includes(tag)) {
                    return max;
                }
                return Math.max(max, this.pity[tag] ?? 0);
            }, 0);
            const actBonus = 1 + actIndex * 0.1;
            const pityBonus = 1 + missCount * 0.2;
            return { disciple, weight: disciple.shopWeight * actBonus * pityBonus };
        });

        for (let i = 0; i < 5; i++) {
            const pick = this.rng.pickWeighted(boosted);
            items.push({
                id: pick.disciple.id,
                name: pick.disciple.name,
                price: Math.max(2, pick.disciple.rarity * 2),
                tags: pick.disciple.tags,
            });
        }

        activeTags.forEach((tag) => {
            const hasTag = items.some((item) => item.tags.includes(tag));
            if (hasTag) {
                this.pity[tag] = 0;
            } else {
                this.pity[tag] = (this.pity[tag] ?? 0) + 1;
            }
        });

        return { items };
    }

    getPitySnapshot(): Record<string, number> {
        return { ...this.pity };
    }
}
