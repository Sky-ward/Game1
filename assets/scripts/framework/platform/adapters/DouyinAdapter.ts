import { LaunchOptions, PlatformAdapter, RewardedAdResult } from '../Platform';

export class DouyinAdapter implements PlatformAdapter {
    getLaunchOptions(): LaunchOptions {
        try {
            const options = tt.getLaunchOptionsSync();
            return { scene: options.scene, query: options.query };
        } catch (error) {
            console.warn('[DouyinAdapter] getLaunchOptionsSync failed', error);
            return { scene: 'unknown', query: {} };
        }
    }

    async showRewardedAd(adUnitId: string): Promise<RewardedAdResult> {
        if (!adUnitId) {
            return { success: false, message: '未配置激励视频 adUnitId' };
        }
        return new Promise((resolve) => {
            try {
                const videoAd = tt.createRewardedVideoAd({ adUnitId });
                videoAd.onClose((res: { isEnded: boolean }) => {
                    resolve({ success: res.isEnded, message: res.isEnded ? '播放完成' : '中途关闭' });
                });
                videoAd.onError((err: unknown) => {
                    console.warn('[DouyinAdapter] rewarded ad error', err);
                    resolve({ success: false, message: '播放失败' });
                });
                videoAd.show();
            } catch (error) {
                console.warn('[DouyinAdapter] showRewardedAd failed', error);
                resolve({ success: false, message: '调用失败' });
            }
        });
    }

    logEvent(name: string, params?: Record<string, string | number>): void {
        try {
            tt.reportAnalytics(name, params ?? {});
        } catch (error) {
            console.warn('[DouyinAdapter] reportAnalytics failed', error);
        }
    }
}
