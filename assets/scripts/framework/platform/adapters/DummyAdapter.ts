import { LaunchOptions, PlatformAdapter, RewardedAdResult } from '../Platform';

export class DummyAdapter implements PlatformAdapter {
    getLaunchOptions(): LaunchOptions {
        return { scene: 'editor', query: {} };
    }

    async showRewardedAd(adUnitId: string): Promise<RewardedAdResult> {
        if (!adUnitId) {
            return { success: false, message: '未配置激励视频 adUnitId' };
        }
        console.log('[DummyAdapter] simulate rewarded ad', adUnitId);
        return { success: true, message: '模拟播放成功' };
    }

    logEvent(name: string, params?: Record<string, string | number>): void {
        console.log('[DummyAdapter] logEvent', name, params ?? {});
    }
}
