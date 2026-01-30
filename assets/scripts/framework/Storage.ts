export class Storage {
    static get<T>(key: string, defaultValue: T): T {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return defaultValue;
        }
        try {
            return JSON.parse(raw) as T;
        } catch (error) {
            console.warn('[Storage] parse failed', error);
            return defaultValue;
        }
    }

    static set<T>(key: string, value: T) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
