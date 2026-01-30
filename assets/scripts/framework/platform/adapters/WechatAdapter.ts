import { LaunchOptions, PlatformAdapter, RewardedAdResult } from '../Platform';

export class WechatAdapter implements PlatformAdapter {
    getLaunchOptions(): LaunchOptions {
        try {
            const options = wx.getLaunchOptionsSync();
            return { scene: options.scene, query: options.query };
        } catch (error) {
            console.warn('[WechatAdapter] getLaunchOptionsSync failed', error);
            return { scene: 'unknown', query: {} };
        }
    }

    async showRewardedAd(adUnitId: string): Promise<RewardedAdResult> {
        if (!adUnitId) {
            return { success: false, message: '未配置激励视频 adUnitId' };
        }
        return new Promise((resolve) => {
            try {
                const videoAd = wx.createRewardedVideoAd({ adUnitId });
                videoAd.onClose((res: { isEnded: boolean }) => {
                    resolve({ success: res.isEnded, message: res.isEnded ? '播放完成' : '中途关闭' });
                });
                videoAd.onError((err: unknown) => {
                    console.warn('[WechatAdapter] rewarded ad error', err);
                    resolve({ success: false, message: '播放失败' });
                });
                videoAd.show();
            } catch (error) {
                console.warn('[WechatAdapter] showRewardedAd failed', error);
                resolve({ success: false, message: '调用失败' });
            }
        });
    }

    logEvent(name: string, params?: Record<string, string | number>): void {
        try {
            wx.reportAnalytics(name, params ?? {});
        } catch (error) {
            console.warn('[WechatAdapter] reportAnalytics failed', error);
        }
    }
}
