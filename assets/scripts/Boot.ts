import { _decorator, Component, Node, Label, Color, Size, Vec3 } from 'cc';
import { Platform } from './framework/platform/Platform';
import { Config } from './framework/Config';
import { GameManager, GameState } from './games/xianxia/GameManager';
import { DebugPanel } from './framework/DebugPanel';
import { createButton, createLabel, createPanel, createToast } from './framework/ui/UIHelpers';
import { safeJsonStringify, safeSliceString } from './framework/SafeUtils';

const { ccclass } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
    private gameManager!: GameManager;
    private screenRoot!: Node;
    private debugPanel!: DebugPanel;
    private toastLabel!: Label;
    private toastRoot!: Node;

    async start() {
        Platform.init();
        const launch = Platform.getLaunchOptions();
        console.log('[Boot] launch options', launch);

        await Config.loadAll();

        this.screenRoot = new Node('ScreenRoot');
        this.screenRoot.setParent(this.node);

        this.gameManager = new GameManager();
        this.gameManager.onStateChanged = () => this.render();
        this.gameManager.onToast = (message) => this.showToast(message);

        this.debugPanel = new DebugPanel(this.node, this.gameManager);

        const toast = createToast(this.node, '');
        this.toastRoot = toast.root;
        this.toastLabel = toast.label;
        this.toastRoot.setPosition(new Vec3(0, -320));
        this.toastRoot.active = false;

        this.render();
    }

    private clearScreen() {
        this.screenRoot.removeAllChildren();
    }

    private render() {
        this.clearScreen();
        const state = this.gameManager.state;
        const info = this.gameManager.getRunInfo();
        const launchHint = Platform.getLaunchOptions();
        const hud = createPanel(this.screenRoot, new Size(780, 90));
        hud.setPosition(new Vec3(0, 280));
        const nodeLabel = this.formatNodeType(info.nodeType);
        const header = createLabel(
            hud,
            `道心:${info.life}  灵石:${info.gold}  第${info.act + 1}幕 第${info.node + 1}节点 (${nodeLabel})`
        );
        header.node.setPosition(new Vec3(0, 10));
        header.color = new Color(200, 220, 255);
        const query = safeJsonStringify(launchHint.query ?? {});
        const scene = safeSliceString(launchHint.scene ?? '-', 12);
        const sub = createLabel(hud, `场景:${scene}  参数:${query}`);
        sub.node.setPosition(new Vec3(0, -22));
        sub.fontSize = 14;
        sub.lineHeight = 18;

        const mainPanel = createPanel(this.screenRoot, new Size(780, 360));
        mainPanel.setPosition(new Vec3(0, 40));
        const footerPanel = createPanel(this.screenRoot, new Size(780, 110));
        footerPanel.setPosition(new Vec3(0, -250));

        switch (state) {
            case GameState.Menu:
                this.renderMenu(mainPanel, footerPanel);
                break;
            case GameState.Map:
                this.renderMap(mainPanel, footerPanel);
                break;
            case GameState.Battle:
                this.renderBattle(mainPanel, footerPanel);
                break;
            case GameState.Reward:
                this.renderReward(mainPanel, footerPanel);
                break;
            case GameState.Shop:
                this.renderShop(mainPanel, footerPanel);
                break;
            case GameState.Event:
                this.renderEvent(mainPanel, footerPanel);
                break;
            case GameState.Boss:
                this.renderBoss(mainPanel, footerPanel);
                break;
            case GameState.Result:
                this.renderResult(mainPanel, footerPanel);
                break;
            case GameState.Revive:
                this.renderRevive(mainPanel, footerPanel);
                break;
            default:
                this.renderMenu(mainPanel, footerPanel);
                break;
        }
    }

    private renderMenu(main: Node, footer: Node) {
        createLabel(main, '修仙题材随机肉鸽 MVP').node.setPosition(new Vec3(0, 120));
        createLabel(main, '点击开始，进入 3 幕 × 5 节点的修仙旅途').node.setPosition(new Vec3(0, 60));
        createLabel(main, '你可以在 GM 面板体验调试功能。').node.setPosition(new Vec3(0, 0));

        createButton(footer, '开始新局', () => {
            this.gameManager.startNewRun();
            this.showToast('新局已创建，点击进入节点');
        }).node.setPosition(new Vec3(-140, -10));

        createButton(footer, this.debugPanel.isVisible() ? '关闭GM面板' : '打开GM面板', () => {
            this.debugPanel.toggle();
            this.showToast(this.debugPanel.isVisible() ? 'GM 面板已打开' : 'GM 面板已关闭');
            this.render();
        }).node.setPosition(new Vec3(140, -10));
    }

    private renderMap(main: Node, footer: Node) {
        createLabel(main, '地图推进').node.setPosition(new Vec3(0, 140));
        const mapText = createLabel(main, this.gameManager.getMapPreview());
        mapText.node.setPosition(new Vec3(0, 60));
        mapText.fontSize = 16;
        mapText.lineHeight = 22;
        createLabel(main, '准备进入当前节点，点击下方按钮继续。').node.setPosition(new Vec3(0, -80));

        createButton(footer, '进入当前节点', () => {
            this.gameManager.enterCurrentNode();
            this.showToast('已进入当前节点');
        }).node.setPosition(new Vec3(0, -10));
    }

    private renderBattle(main: Node, footer: Node) {
        const battleReport = this.gameManager.getBattleReport();
        createLabel(main, `斗法结果：${battleReport.result}`).node.setPosition(new Vec3(0, 120));
        const detail = createLabel(main, battleReport.detail);
        detail.node.setPosition(new Vec3(0, 60));
        detail.fontSize = 16;
        detail.lineHeight = 22;
        createLabel(main, battleReport.result === '胜利' ? '胜利后可领取奖励' : '失败扣道心，继续前进').node.setPosition(new Vec3(0, -20));
        const buttonText = battleReport.result === '胜利' ? '领取奖励' : '继续前进';
        createButton(footer, buttonText, () => {
            this.gameManager.toReward();
        }).node.setPosition(new Vec3(0, -10));
    }

    private renderReward(main: Node, footer: Node) {
        createLabel(main, '天道敕令 · 奖励三选一').node.setPosition(new Vec3(0, 140));
        const rewards = this.gameManager.getCurrentRewards();
        rewards.forEach((reward, index) => {
            const button = createButton(main, `${reward.type}:${reward.name}`, () => {
                this.gameManager.chooseReward(index);
                this.showToast(`获得 ${reward.name}`);
            });
            button.node.setPosition(new Vec3(0, 60 - index * 70));
        });
        createButton(footer, '放弃奖励，继续前进', () => {
            this.gameManager.advanceNode();
            this.showToast('已放弃奖励');
        }).node.setPosition(new Vec3(0, -10));
    }

    private renderShop(main: Node, footer: Node) {
        createLabel(main, '坊市 · 5 格商品').node.setPosition(new Vec3(0, 140));
        const shop = this.gameManager.getShopSnapshot();
        shop.items.forEach((item, index) => {
            const button = createButton(main, `${item.name}(${item.price}) [${item.tags.join('/')}]`, () => {
                this.gameManager.buyShopItem(index);
                this.showToast(`已购买 ${item.name}`);
                this.render();
            });
            button.node.setPosition(new Vec3(0, 80 - index * 55));
        });
        createButton(main, '刷新(5灵石)', () => {
            this.gameManager.refreshShop();
            this.showToast('商店刷新');
            this.render();
        }).node.setPosition(new Vec3(-140, -140));
        createButton(footer, '离开商店，继续前进', () => {
            this.gameManager.advanceNode();
        }).node.setPosition(new Vec3(0, -10));
    }

    private renderEvent(main: Node, footer: Node) {
        const event = this.gameManager.getCurrentEvent();
        createLabel(main, `${event.name}`).node.setPosition(new Vec3(0, 140));
        const desc = createLabel(main, event.desc);
        desc.node.setPosition(new Vec3(0, 90));
        desc.fontSize = 16;
        desc.lineHeight = 22;
        event.options.forEach((option, index) => {
            const button = createButton(main, `${option.previewTag} ${option.desc}`, () => {
                this.gameManager.chooseEventOption(index);
                this.showToast(`选择:${option.previewTag}`);
            });
            button.node.setPosition(new Vec3(0, 20 - index * 70));
        });
        createButton(footer, '放弃奇遇，继续前进', () => {
            this.gameManager.advanceNode();
            this.showToast('已放弃奇遇');
        }).node.setPosition(new Vec3(0, -10));
    }

    private renderBoss(main: Node, footer: Node) {
        const battleReport = this.gameManager.getBattleReport();
        createLabel(main, `Boss 斗法：${battleReport.result}`).node.setPosition(new Vec3(0, 120));
        const detail = createLabel(main, battleReport.detail);
        detail.node.setPosition(new Vec3(0, 60));
        detail.fontSize = 16;
        detail.lineHeight = 22;
        createLabel(main, battleReport.result === '胜利' ? '战胜 Boss，获得奖励' : '挑战失败，扣道心').node.setPosition(new Vec3(0, -10));
        const buttonText = battleReport.result === '胜利' ? '领取奖励' : '继续前进';
        createButton(footer, buttonText, () => {
            this.gameManager.toReward();
        }).node.setPosition(new Vec3(0, -10));
    }

    private renderResult(main: Node, footer: Node) {
        const summary = this.gameManager.getResultSummary();
        createLabel(main, summary).node.setPosition(new Vec3(0, 80));
        createButton(footer, '重开一局', () => {
            this.gameManager.startNewRun();
        }).node.setPosition(new Vec3(-140, -10));
        createButton(footer, '返回菜单', () => {
            this.gameManager.goToMenu();
        }).node.setPosition(new Vec3(140, -10));
    }

    private renderRevive(main: Node, footer: Node) {
        createLabel(main, '护道重生：观看激励视频可复活').node.setPosition(new Vec3(0, 60));
        createButton(footer, '模拟复活', () => {
            this.gameManager.revive(true);
            this.showToast('已复活');
        }).node.setPosition(new Vec3(-140, -10));
        createButton(footer, '放弃', () => {
            this.gameManager.revive(false);
            this.showToast('放弃复活');
        }).node.setPosition(new Vec3(140, -10));
    }

    private showToast(message: string) {
        this.toastLabel.string = message;
        this.toastRoot.active = true;
        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            this.toastRoot.active = false;
        }, 1.6);
    }

    private formatNodeType(type: string): string {
        switch (type) {
            case 'battle':
                return '战斗';
            case 'event':
                return '奇遇';
            case 'shop':
                return '商店';
            case 'elite':
                return '精英';
            case 'boss':
                return 'Boss';
            default:
                return '未知';
        }
    }
}
