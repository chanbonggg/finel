export const safeJsonLd = (obj: Record<string, unknown>): string => JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");

export const uniqueStrings = (values: Array<string | null | undefined>): string[] => Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));

export const truncateMeta = (value: string, length = 158): string => value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;
