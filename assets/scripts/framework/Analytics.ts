export class Analytics {
    private static queue: { name: string; params?: Record<string, string | number> }[] = [];

    static track(name: string, params?: Record<string, string | number>) {
        console.log('[Analytics]', name, params ?? {});
        Analytics.queue.push({ name, params });
    }

    static flush() {
        console.log('[Analytics] flush', Analytics.queue.length);
        Analytics.queue = [];
    }
}
