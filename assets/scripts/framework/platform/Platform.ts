import { DummyAdapter } from './adapters/DummyAdapter';
import { DouyinAdapter } from './adapters/DouyinAdapter';
import { WechatAdapter } from './adapters/WechatAdapter';

export interface LaunchOptions {
    scene?: string | number;
    query?: Record<string, string>;
}

export interface RewardedAdResult {
    success: boolean;
    message: string;
}

export interface PlatformAdapter {
    getLaunchOptions(): LaunchOptions;
    showRewardedAd(adUnitId: string): Promise<RewardedAdResult>;
    logEvent(name: string, params?: Record<string, string | number>): void;
}

export class Platform {
    private static adapter: PlatformAdapter = new DummyAdapter();

    static init() {
        if (typeof tt !== 'undefined') {
            Platform.adapter = new DouyinAdapter();
            return;
        }
        if (typeof wx !== 'undefined') {
            Platform.adapter = new WechatAdapter();
            return;
        }
        Platform.adapter = new DummyAdapter();
    }

    static getLaunchOptions(): LaunchOptions {
        return Platform.adapter.getLaunchOptions();
    }

    static showRewardedAd(adUnitId: string): Promise<RewardedAdResult> {
        return Platform.adapter.showRewardedAd(adUnitId);
    }

    static logEvent(name: string, params?: Record<string, string | number>) {
        Platform.adapter.logEvent(name, params);
    }
}
