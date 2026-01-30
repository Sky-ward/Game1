import { Node, Size, Vec3, Label, Color } from 'cc';
import { GameManager } from '../games/xianxia/GameManager';
import { createButton, createLabel, createPanel } from './ui/UIHelpers';
import { safeJsonStringify } from './SafeUtils';

export class DebugPanel {
    private root: Node;
    private visible = false;
    private infoLabel!: Label;

    constructor(parent: Node, private game: GameManager) {
        this.root = new Node('DebugPanel');
        this.root.setParent(parent);
        this.root.setPosition(new Vec3(340, -60));
        this.root.active = false;
        this.build();
    }

    isVisible(): boolean {
        return this.visible;
    }

    toggle() {
        this.visible = !this.visible;
        this.root.active = this.visible;
        if (this.visible) {
            this.refresh();
        }
    }

    private build() {
        const panel = createPanel(this.root, new Size(320, 420));
        panel.setPosition(new Vec3(0, 0));
        const title = createLabel(panel, 'GM 调试面板');
        title.node.setPosition(new Vec3(0, 170));
        title.color = new Color(255, 220, 120);

        this.infoLabel = createLabel(panel, '');
        this.infoLabel.node.setPosition(new Vec3(0, 110));
        this.infoLabel.fontSize = 14;
        this.infoLabel.lineHeight = 18;

        createButton(panel, '加灵石 +50', () => {
            this.game.gmAddGold(50);
            this.refresh();
        }).node.setPosition(new Vec3(0, 60));

        createButton(panel, '加道心 +1', () => {
            this.game.gmAddLife(1);
            this.refresh();
        }).node.setPosition(new Vec3(0, 10));

        createButton(panel, '跳到下一节点', () => {
            this.game.gmGoNextNode();
            this.refresh();
        }).node.setPosition(new Vec3(0, -40));

        createButton(panel, '强制刷新商店', () => {
            this.game.gmRefreshShop();
            this.refresh();
        }).node.setPosition(new Vec3(0, -90));

        createButton(panel, '强制发放海克斯', () => {
            this.game.gmForceHexReward();
            this.refresh();
        }).node.setPosition(new Vec3(0, -140));

        createButton(panel, '查看保底状态', () => {
            this.game.gmShowPity();
            this.refresh();
        }).node.setPosition(new Vec3(0, -190));
    }

    private refresh() {
        const pity = this.game.getPitySnapshot();
        const info = this.game.getRunInfo();
        this.infoLabel.string = `道心:${info.life} 灵石:${info.gold}\n` +
            `幕:${info.act + 1}-节点:${info.node + 1}\n` +
            `保底:${safeJsonStringify(pity)}`;
    }
}
