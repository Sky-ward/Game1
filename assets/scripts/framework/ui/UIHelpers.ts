import { Button, Color, Graphics, Label, Node, Size, UITransform, Vec3 } from 'cc';

export function createPanel(parent: Node, size: Size): Node {
    const panel = new Node('Panel');
    panel.setParent(parent);
    const transform = panel.addComponent(UITransform);
    transform.setContentSize(size);
    const graphics = panel.addComponent(Graphics);
    graphics.fillColor = new Color(20, 24, 45, 220);
    graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
    graphics.fill();
    return panel;
}

export function createLabel(parent: Node, text: string): Label {
    const node = new Node('Label');
    node.setParent(parent);
    const label = node.addComponent(Label);
    label.string = text;
    label.color = new Color(255, 255, 255);
    label.fontSize = 20;
    label.lineHeight = 24;
    node.setPosition(new Vec3(0, 0));
    return label;
}

export function createButton(parent: Node, text: string, onClick: () => void): Button {
    const node = new Node('Button');
    node.setParent(parent);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(new Size(240, 50));
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(60, 80, 120, 255);
    graphics.rect(-120, -25, 240, 50);
    graphics.fill();

    const label = createLabel(node, text);
    label.node.setPosition(new Vec3(0, -8));

    const button = node.addComponent(Button);
    button.transition = Button.Transition.NONE;
    node.on(Button.EventType.CLICK, () => onClick());
    return button;
}

export function createToast(parent: Node, text: string): { root: Node; label: Label } {
    const root = new Node('Toast');
    root.setParent(parent);
    const transform = root.addComponent(UITransform);
    transform.setContentSize(new Size(520, 46));
    const graphics = root.addComponent(Graphics);
    graphics.fillColor = new Color(20, 20, 20, 220);
    graphics.rect(-260, -23, 520, 46);
    graphics.fill();

    const label = createLabel(root, text);
    label.fontSize = 18;
    label.lineHeight = 22;
    label.node.setPosition(new Vec3(0, -6));
    return { root, label };
}
