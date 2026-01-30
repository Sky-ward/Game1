import { Config } from '../../framework/Config';
import { safeArray } from '../../framework/SafeUtils';
import { RNG } from '../../framework/RNG';
import { BattleManager, BattleReport, DiscipleConfig, HexConfig, ArtifactConfig } from './BattleManager';
import { MapManager, MapNode, NodeType } from './MapManager';
import { RewardManager, RewardOption } from './RewardManager';
import { ShopManager, ShopSnapshot } from './ShopManager';

export enum GameState {
    Menu = 'menu',
    Map = 'map',
    Battle = 'battle',
    Reward = 'reward',
    Shop = 'shop',
    Event = 'event',
    Boss = 'boss',
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
    onToast?: (message: string) => void;

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
        const disciples = this.getDisciples();
        this.team = disciples.slice(0, 2);
        this.hexes = [];
        this.artifacts = [];
        this.state = GameState.Map;
        this.emitStateChanged();
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
        const node = this.getCurrentNode();
        return {
            act: this.actIndex,
            node: this.nodeIndex,
            life: this.life,
            gold: this.gold,
            nodeType: node.type,
        };
    }

    getMapPreview(): string {
        if (this.map.length === 0) {
            return '地图尚未生成';
        }
        const labels: Record<NodeType, string> = {
            battle: '战',
            event: '奇',
            shop: '商',
            elite: '精',
            boss: 'Boss',
        };
        return this.map
            .map((act, actIndex) => {
                const nodes = act
                    .map((node, nodeIdx) => {
                        const label = labels[node.type];
                        if (actIndex === this.actIndex && nodeIdx === this.nodeIndex) {
                            return `[${label}]`;
                        }
                        return ` ${label} `;
                    })
                    .join(' ');
                return `第${actIndex + 1}幕: ${nodes}`;
            })
            .join('\n');
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

    enterCurrentNode() {
        this.enterNode();
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
            const disciple = this.getDisciples().find((d) => d.id === reward.payloadId);
            if (disciple) {
                this.team.push(disciple);
            }
        } else if (reward.type === 'hex') {
            const hex = this.getHexes().find((h) => h.id === reward.payloadId);
            if (hex) {
                this.hexes.push(hex);
            }
        } else {
            const artifact = this.getArtifacts().find((a) => a.id === reward.payloadId);
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
        const disciple = this.getDisciples().find((d) => d.id === item.id);
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
            this.getDisciples(),
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
        this.state = GameState.Map;
        this.emitStateChanged();
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
            this.getDisciples(),
            this.getHexes(),
            this.getArtifacts()
        ).map((reward, index) => (index === 0 ? { ...reward, type: 'hex' as const } : reward));
        this.state = GameState.Reward;
        this.emitStateChanged();
    }

    gmAddGold(amount = 50) {
        this.addGold(amount);
        this.toast(`灵石 +${amount}`);
        this.emitStateChanged();
    }

    gmAddLife(amount = 1) {
        this.addLife(amount);
        this.toast(`道心 +${amount}`);
        this.emitStateChanged();
    }

    gmGoNextNode() {
        if (this.state === GameState.Menu || this.map.length === 0) {
            this.startNewRun();
            this.toast('已自动开始新局');
            this.enterCurrentNode();
            return;
        }
        if (this.state === GameState.Map) {
            this.enterCurrentNode();
            this.toast('进入当前节点');
            return;
        }
        this.advanceNode();
        if (this.state !== GameState.Result) {
            this.enterCurrentNode();
            this.toast('已推进到下一节点');
        } else {
            this.toast('进入结算');
        }
    }

    gmRefreshShop() {
        if (this.state !== GameState.Shop) {
            this.toast('当前不在商店节点');
            return;
        }
        this.refreshShop(true);
        this.toast('商店已刷新');
        this.emitStateChanged();
    }

    gmForceHexReward() {
        this.forceHexReward();
        this.toast('触发海克斯三选一');
    }

    gmShowPity() {
        const pity = this.getPitySnapshot();
        const summary = Object.keys(pity).length ? JSON.stringify(pity) : '暂无保底记录';
        this.toast(`保底状态:${summary}`);
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
                    this.state = node.type === 'boss' ? GameState.Boss : GameState.Battle;
                }
            } else {
                this.gold += 5 + this.actIndex * 2;
                this.currentRewards = this.rewardManager.generateRewards(
                    this.getDisciples(),
                    this.getHexes(),
                    this.getArtifacts()
                );
                this.state = node.type === 'boss' ? GameState.Boss : GameState.Battle;
            }
        } else if (node.type === 'shop') {
            this.currentShop = this.shopManager.generateShop(
                this.getDisciples(),
                this.actIndex,
                this.getActiveTags()
            );
            this.state = GameState.Shop;
        } else {
            const events = this.getEvents();
            if (events.length > 0) {
                this.currentEvent = events[this.rng.nextInt(0, events.length - 1)];
            }
            this.state = GameState.Event;
        }
        this.emitStateChanged();
    }

    private getCurrentNode(): MapNode {
        return this.map[this.actIndex]?.[this.nodeIndex] ?? { type: 'battle' };
    }

    private getDisciples(): DiscipleConfig[] {
        const disciples = safeArray(Config.get<DiscipleConfig[]>('disciples'));
        if (disciples.length > 0) {
            return disciples;
        }
        return [
            {
                id: 1,
                name: '凡人弟子',
                rarity: 1,
                tags: ['凡人'],
                baseStats: { hp: 80, atk: 12, speed: 1 },
                skill: { desc: '基础攻击', params: {} },
                upgrade: { level2: {}, level3: {}, mechanic: '' },
                shopWeight: 1,
            },
        ];
    }

    private getHexes(): HexConfig[] {
        const hexes = safeArray(Config.get<HexConfig[]>('hexes'));
        if (hexes.length > 0) {
            return hexes;
        }
        return [
            {
                id: 1,
                name: '凡心',
                category: '通用',
                rarity: 1,
                weight: 1,
                desc: '基础加成',
                tags: ['凡人'],
                stackRule: 'stack',
            },
        ];
    }

    private getArtifacts(): ArtifactConfig[] {
        const artifacts = safeArray(Config.get<ArtifactConfig[]>('artifacts'));
        if (artifacts.length > 0) {
            return artifacts;
        }
        return [
            {
                id: 1,
                name: '护身符',
                recipe: [],
                trigger: '被动',
                effect: { desc: '微弱提升', params: {} },
                rarity: 1,
            },
        ];
    }

    private getEvents(): EventConfig[] {
        const events = safeArray(Config.get<EventConfig[]>('events'));
        if (events.length > 0) {
            return events;
        }
        return [
            {
                id: 1,
                name: '山间奇遇',
                desc: '你在山路遇到灵泉。',
                options: [
                    { desc: '小饮一口', cost: { type: 'life', amount: 0 }, reward: { type: 'life', amount: 1 }, previewTag: '恢复' },
                    { desc: '装满灵水', cost: { type: 'gold', amount: 0 }, reward: { type: 'gold', amount: 3 }, previewTag: '收获' },
                ],
            },
        ];
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

    private toast(message: string) {
        if (this.onToast) {
            this.onToast(message);
        }
    }
}
