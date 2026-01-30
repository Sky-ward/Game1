import { Button, Node } from 'cc';
import { createButton } from './UIHelpers';

export class UIButton {
    static create(parent: Node, text: string, onClick: () => void): Button {
        return createButton(parent, text, onClick);
    }
}
