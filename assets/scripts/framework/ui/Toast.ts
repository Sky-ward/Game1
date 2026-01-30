import { Node, Label, Vec3, Color } from 'cc';
import { createLabel } from './UIHelpers';

export class Toast {
    private label: Label;
    private timer = 0;

    constructor(private parent: Node) {
        this.label = createLabel(parent, '');
        this.label.node.setPosition(new Vec3(0, -300));
        this.label.color = new Color(255, 230, 120);
        this.label.node.active = false;
    }

    show(message: string, duration = 2) {
        this.label.string = message;
        this.label.node.active = true;
        this.timer = duration;
        setTimeout(() => {
            this.label.node.active = false;
        }, duration * 1000);
    }
}
