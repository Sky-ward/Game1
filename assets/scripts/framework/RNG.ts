export class RNG {
    private seed: number;

    constructor(seed = Date.now()) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) {
            this.seed += 2147483646;
        }
    }

    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pickWeighted<T extends { weight: number }>(items: T[]): T {
        const total = items.reduce((sum, item) => sum + item.weight, 0);
        const roll = this.next() * total;
        let acc = 0;
        for (const item of items) {
            acc += item.weight;
            if (roll <= acc) {
                return item;
            }
        }
        return items[items.length - 1];
    }
}
