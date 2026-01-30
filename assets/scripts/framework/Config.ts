import { resources, TextAsset } from 'cc';

export class Config {
    private static cache: Map<string, unknown> = new Map();

    static async loadAll(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.loadDir('xianxia/configs', TextAsset, (err, assets) => {
                if (err) {
                    console.error('[Config] loadDir failed', err);
                    reject(err);
                    return;
                }
                assets.forEach((asset) => {
                    try {
                        Config.cache.set(asset.name, JSON.parse(asset.text));
                    } catch (error) {
                        console.warn(`[Config] parse ${asset.name} failed`, error);
                    }
                });
                console.log('[Config] loaded', Array.from(Config.cache.keys()));
                resolve();
            });
        });
    }

    static get<T>(name: string): T {
        return Config.cache.get(name) as T;
    }

    static reload(name: string, data: unknown) {
        Config.cache.set(name, data);
    }
}
