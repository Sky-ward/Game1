import { Node, Size } from 'cc';
import { createPanel } from './UIHelpers';

export class Panel {
    static create(parent: Node, size: Size): Node {
        return createPanel(parent, size);
    }
}
