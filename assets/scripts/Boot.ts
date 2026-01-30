import { _decorator, Component, Node, Label, Color, Size, Vec3 } from 'cc';
import { Platform } from './framework/platform/Platform';
import { Config } from './framework/Config';
import { GameManager, GameState } from './games/xianxia/GameManager';
import { DebugPanel } from './framework/DebugPanel';
import { createButton, createLabel, createPanel } from './framework/ui/UIHelpers';

const { ccclass } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
    private gameManager!: GameManager;
    private screenRoot!: Node;
    private infoLabel!: Label;
    private debugPanel!: DebugPanel;

    async start() {
        Platform.init();
        const launch = Platform.getLaunchOptions();
        console.log('[Boot] launch options', launch);

        await Config.loadAll();

        this.screenRoot = new Node('ScreenRoot');
        this.screenRoot.setParent(this.node);

        this.infoLabel = createLabel(this.node, '');
        this.infoLabel.node.setPosition(new Vec3(0, 320));
        this.infoLabel.color = new Color(200, 220, 255);

        this.gameManager = new GameManager();
        this.gameManager.onStateChanged = () => this.render();

        this.debugPanel = new DebugPanel(this.node, this.gameManager);

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
        this.infoLabel.string = `修仙随机肉鸽 | 道心:${info.life} 灵石:${info.gold} 幕:${info.act + 1}-节点:${info.node + 1}\n` +
            `当前节点:${info.nodeType} | 复访scene:${launchHint.scene ?? '-'} query:${JSON.stringify(launchHint.query ?? {})}`;

        switch (state) {
            case GameState.Menu:
                this.renderMenu();
                break;
            case GameState.Battle:
                this.renderBattle();
                break;
            case GameState.Reward:
                this.renderReward();
                break;
            case GameState.Shop:
                this.renderShop();
                break;
            case GameState.Event:
                this.renderEvent();
                break;
            case GameState.Result:
                this.renderResult();
                break;
            case GameState.Revive:
                this.renderRevive();
                break;
            default:
                this.renderMenu();
                break;
        }
    }

    private renderMenu() {
        const panel = createPanel(this.screenRoot, new Size(700, 400));
        createLabel(panel, '修仙题材随机肉鸽 MVP').node.setPosition(new Vec3(0, 120));
        createLabel(panel, '点击开始，自动生成 3 幕 × 5 节点').node.setPosition(new Vec3(0, 60));

        createButton(panel, '开始新局', () => {
            this.gameManager.startNewRun();
        }).node.setPosition(new Vec3(0, -20));

        createButton(panel, this.debugPanel.isVisible() ? '关闭GM面板' : '打开GM面板', () => {
            this.debugPanel.toggle();
            this.render();
        }).node.setPosition(new Vec3(0, -100));
    }

    private renderBattle() {
        const panel = createPanel(this.screenRoot, new Size(720, 420));
        const battleReport = this.gameManager.getBattleReport();
        createLabel(panel, `斗法结果：${battleReport.result}\n${battleReport.detail}`).node.setPosition(new Vec3(0, 60));
        const buttonText = battleReport.result === '胜利' ? '领取奖励' : '继续前进';
        createButton(panel, buttonText, () => {
            this.gameManager.toReward();
        }).node.setPosition(new Vec3(0, -120));
    }

    private renderReward() {
        const panel = createPanel(this.screenRoot, new Size(760, 460));
        createLabel(panel, '天道敕令 · 奖励三选一').node.setPosition(new Vec3(0, 180));
        const rewards = this.gameManager.getCurrentRewards();
        rewards.forEach((reward, index) => {
            const button = createButton(panel, `${reward.type}:${reward.name}`, () => {
                this.gameManager.chooseReward(index);
            });
            button.node.setPosition(new Vec3(0, 100 - index * 80));
        });
    }

    private renderShop() {
        const panel = createPanel(this.screenRoot, new Size(780, 480));
        createLabel(panel, '坊市 · 5 格商品').node.setPosition(new Vec3(0, 200));
        const shop = this.gameManager.getShopSnapshot();
        shop.items.forEach((item, index) => {
            const button = createButton(panel, `${item.name}(${item.price}) [${item.tags.join('/')}]`, () => {
                this.gameManager.buyShopItem(index);
                this.render();
            });
            button.node.setPosition(new Vec3(0, 140 - index * 60));
        });
        createButton(panel, '刷新(5灵石)', () => {
            this.gameManager.refreshShop();
            this.render();
        }).node.setPosition(new Vec3(-140, -200));
        createButton(panel, '继续前进', () => {
            this.gameManager.advanceNode();
        }).node.setPosition(new Vec3(140, -200));
    }

    private renderEvent() {
        const panel = createPanel(this.screenRoot, new Size(760, 460));
        const event = this.gameManager.getCurrentEvent();
        createLabel(panel, `${event.name}\n${event.desc}`).node.setPosition(new Vec3(0, 160));
        event.options.forEach((option, index) => {
            const button = createButton(panel, `${option.previewTag} ${option.desc}`, () => {
                this.gameManager.chooseEventOption(index);
            });
            button.node.setPosition(new Vec3(0, 80 - index * 80));
        });
    }

    private renderResult() {
        const panel = createPanel(this.screenRoot, new Size(700, 400));
        const summary = this.gameManager.getResultSummary();
        createLabel(panel, summary).node.setPosition(new Vec3(0, 80));
        createButton(panel, '重开一局', () => {
            this.gameManager.startNewRun();
        }).node.setPosition(new Vec3(0, -80));
        createButton(panel, '返回菜单', () => {
            this.gameManager.goToMenu();
        }).node.setPosition(new Vec3(0, -150));
    }

    private renderRevive() {
        const panel = createPanel(this.screenRoot, new Size(700, 400));
        createLabel(panel, '护道重生：观看激励视频可复活').node.setPosition(new Vec3(0, 60));
        createButton(panel, '模拟复活', () => {
            this.gameManager.revive(true);
        }).node.setPosition(new Vec3(0, -40));
        createButton(panel, '放弃', () => {
            this.gameManager.revive(false);
        }).node.setPosition(new Vec3(0, -120));
    }
}
