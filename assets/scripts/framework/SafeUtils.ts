export function safeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

export function safeJsonStringify(value: unknown, fallback = '-'): string {
    try {
        const result = JSON.stringify(value);
        return result ?? fallback;
    } catch (error) {
        console.warn('[SafeUtils] stringify failed', error);
        return fallback;
    }
}

export function safeSliceString(value: unknown, maxLen: number, fallback = '-'): string {
    if (typeof value !== 'string') {
        return fallback;
    }
    return value.slice(0, maxLen);
}
