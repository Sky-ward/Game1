import { Config } from '../../framework/Config';
import { RNG } from '../../framework/RNG';
import { BattleManager, BattleReport, DiscipleConfig, HexConfig, ArtifactConfig } from './BattleManager';
import { MapManager, MapNode, NodeType } from './MapManager';
import { RewardManager, RewardOption } from './RewardManager';
import { ShopManager, ShopSnapshot } from './ShopManager';

export enum GameState {
    Menu = 'menu',
    Battle = 'battle',
    Reward = 'reward',
    Shop = 'shop',
    Event = 'event',
    Result = 'result',
    Revive = 'revive',
}

export interface EventOption {
    desc: string;
    cost: { type: string; amount: number };
    reward: { type: string; amount: number };
    previewTag: string;
}

export interface EventConfig {
    id: number;
    name: string;
    desc: string;
    options: EventOption[];
}

export class GameManager {
    state: GameState = GameState.Menu;
    onStateChanged?: () => void;

    private rng = new RNG();
    private map: MapNode[][] = [];
    private actIndex = 0;
    private nodeIndex = 0;
    private life = 5;
    private gold = 20;
    private reviveUsed = false;

    private team: DiscipleConfig[] = [];
    private hexes: HexConfig[] = [];
    private artifacts: ArtifactConfig[] = [];

    private battleReport: BattleReport = { result: '胜利', detail: '' };
    private currentRewards: RewardOption[] = [];
    private currentShop: ShopSnapshot = { items: [] };
    private currentEvent: EventConfig = { id: 0, name: '', desc: '', options: [] };

    private rewardManager = new RewardManager(this.rng);
    private shopManager = new ShopManager(this.rng);

    startNewRun() {
        this.rng = new RNG();
        this.map = MapManager.generate(Date.now());
        this.actIndex = 0;
        this.nodeIndex = 0;
        this.life = 5;
        this.gold = 20;
        this.reviveUsed = false;
        this.team = Config.get<DiscipleConfig[]>('disciples').slice(0, 2);
        this.hexes = [];
        this.artifacts = [];
        this.enterNode();
    }

    goToMenu() {
        this.state = GameState.Menu;
        this.emitStateChanged();
    }

    addGold(amount: number) {
        this.gold += amount;
    }

    addLife(amount: number) {
        this.life += amount;
    }

    getRunInfo() {
        return {
            act: this.actIndex,
            node: this.nodeIndex,
            life: this.life,
            gold: this.gold,
            nodeType: this.getCurrentNode().type,
        };
    }

    getBattleReport(): BattleReport {
        return this.battleReport;
    }

    getCurrentRewards(): RewardOption[] {
        return this.currentRewards;
    }

    getShopSnapshot(): ShopSnapshot {
        return this.currentShop;
    }

    getCurrentEvent(): EventConfig {
        return this.currentEvent;
    }

    getResultSummary(): string {
        const tags = this.getActiveTags();
        return `结算\n最终队伍:${this.team.map((d) => d.name).join('、')}\n羁绊:${tags.join('、')}\n海克斯:${this.hexes.map((h) => h.name).join('、')}`;
    }

    getPitySnapshot(): Record<string, number> {
        return this.shopManager.getPitySnapshot();
    }

    toReward() {
        if (this.battleReport.result === '胜利') {
            this.state = GameState.Reward;
            this.emitStateChanged();
        } else {
            this.advanceNode();
        }
    }

    chooseReward(index: number) {
        const reward = this.currentRewards[index];
        if (!reward) {
            return;
        }
        if (reward.type === 'disciple') {
            const disciple = Config.get<DiscipleConfig[]>('disciples').find((d) => d.id === reward.payloadId);
            if (disciple) {
                this.team.push(disciple);
            }
        } else if (reward.type === 'hex') {
            const hex = Config.get<HexConfig[]>('hexes').find((h) => h.id === reward.payloadId);
            if (hex) {
                this.hexes.push(hex);
            }
        } else {
            const artifact = Config.get<ArtifactConfig[]>('artifacts').find((a) => a.id === reward.payloadId);
            if (artifact) {
                this.artifacts.push(artifact);
            }
        }
        this.advanceNode();
    }

    buyShopItem(index: number) {
        const item = this.currentShop.items[index];
        if (!item || this.gold < item.price) {
            return;
        }
        this.gold -= item.price;
        const disciple = Config.get<DiscipleConfig[]>('disciples').find((d) => d.id === item.id);
        if (disciple) {
            this.team.push(disciple);
        }
    }

    refreshShop(force = false) {
        const cost = 5;
        if (!force && this.gold < cost) {
            return;
        }
        if (!force) {
            this.gold -= cost;
        }
        this.currentShop = this.shopManager.generateShop(
            Config.get<DiscipleConfig[]>('disciples'),
            this.actIndex,
            this.getActiveTags()
        );
    }

    chooseEventOption(index: number) {
        const option = this.currentEvent.options[index];
        if (!option) {
            return;
        }
        if (option.cost.type === 'gold') {
            this.gold = Math.max(0, this.gold - option.cost.amount);
        } else if (option.cost.type === 'life') {
            this.life = Math.max(0, this.life - option.cost.amount);
        }
        if (option.reward.type === 'gold') {
            this.gold += option.reward.amount;
        } else if (option.reward.type === 'life') {
            this.life += option.reward.amount;
        }
        this.advanceNode();
    }

    advanceNode() {
        if (this.nodeIndex < 4) {
            this.nodeIndex += 1;
        } else if (this.actIndex < 2) {
            this.actIndex += 1;
            this.nodeIndex = 0;
        } else {
            this.state = GameState.Result;
            this.emitStateChanged();
            return;
        }
        this.enterNode();
    }

    revive(accept: boolean) {
        if (accept && !this.reviveUsed) {
            this.reviveUsed = true;
            this.life = Math.max(1, this.life);
            this.enterNode();
        } else {
            this.state = GameState.Result;
            this.emitStateChanged();
        }
    }

    forceHexReward() {
        this.currentRewards = this.rewardManager.generateRewards(
            Config.get<DiscipleConfig[]>('disciples'),
            Config.get<HexConfig[]>('hexes'),
            Config.get<ArtifactConfig[]>('artifacts')
        ).map((reward, index) => (index === 0 ? { ...reward, type: 'hex' as const } : reward));
        this.state = GameState.Reward;
        this.emitStateChanged();
    }

    private enterNode() {
        const node = this.getCurrentNode();
        if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
            this.battleReport = BattleManager.simulate(
                this.team,
                this.hexes,
                this.artifacts,
                this.actIndex,
                node.type
            );
            if (this.battleReport.result === '失败') {
                this.life -= 1;
                if (this.life <= 0) {
                    if (!this.reviveUsed) {
                        this.state = GameState.Revive;
                    } else {
                        this.state = GameState.Result;
                    }
                } else {
                    this.state = GameState.Battle;
                }
            } else {
                this.gold += 5 + this.actIndex * 2;
                this.currentRewards = this.rewardManager.generateRewards(
                    Config.get<DiscipleConfig[]>('disciples'),
                    Config.get<HexConfig[]>('hexes'),
                    Config.get<ArtifactConfig[]>('artifacts')
                );
                this.state = GameState.Battle;
            }
        } else if (node.type === 'shop') {
            this.currentShop = this.shopManager.generateShop(
                Config.get<DiscipleConfig[]>('disciples'),
                this.actIndex,
                this.getActiveTags()
            );
            this.state = GameState.Shop;
        } else {
            const events = Config.get<EventConfig[]>('events');
            this.currentEvent = events[this.rng.nextInt(0, events.length - 1)];
            this.state = GameState.Event;
        }
        this.emitStateChanged();
    }

    private getCurrentNode(): MapNode {
        return this.map[this.actIndex]?.[this.nodeIndex] ?? { type: 'battle' };
    }

    private getActiveTags(): string[] {
        const counts: Record<string, number> = {};
        this.team.forEach((disciple) => {
            disciple.tags.forEach((tag) => {
                counts[tag] = (counts[tag] ?? 0) + 1;
            });
        });
        return Object.keys(counts).filter((tag) => counts[tag] >= 2);
    }

    private emitStateChanged() {
        if (this.onStateChanged) {
            this.onStateChanged();
        }
    }
}
