export type BookBatExportFormatId = "json" | "csv" | "goodreads" | "librarything";

export interface BookBatClientConfig {
    showHeader: boolean;
    showFooter: boolean;
    unstyled: boolean;
    features: {
        export: {
            enabled: boolean;
            options: Record<BookBatExportFormatId, boolean>;
        };
        load: {
            enabled: boolean;
        };
    };
}

export interface BookBatClientConfigOverride {
    showHeader?: boolean;
    showFooter?: boolean;
    unstyled?: boolean;
    features?: {
        export?: {
            enabled?: boolean;
            options?: Partial<Record<BookBatExportFormatId, boolean>>;
        };
        load?: {
            enabled?: boolean;
        };
    };
}

export const defaultBookBatClientConfig: BookBatClientConfig = {
    showHeader: true,
    showFooter: true,
    unstyled: false,
    features: {
        export: {
            enabled: true,
            options: {
                json: true,
                csv: true,
                goodreads: true,
                librarything: true,
            },
        },
        load: {
            enabled: false,
        },
    },
};

export function resolveBookBatClientConfig(
    config: BookBatClientConfigOverride = {},
): BookBatClientConfig {
    return {
        showHeader: config.showHeader ?? defaultBookBatClientConfig.showHeader,
        showFooter: config.showFooter ?? defaultBookBatClientConfig.showFooter,
        unstyled: config.unstyled ?? defaultBookBatClientConfig.unstyled,
        features: {
            export: {
                enabled:
                    config.features?.export?.enabled ??
                    defaultBookBatClientConfig.features.export.enabled,
                options: {
                    json:
                        config.features?.export?.options?.json ??
                        defaultBookBatClientConfig.features.export.options.json,
                    csv:
                        config.features?.export?.options?.csv ??
                        defaultBookBatClientConfig.features.export.options.csv,
                    goodreads:
                        config.features?.export?.options?.goodreads ??
                        defaultBookBatClientConfig.features.export.options
                            .goodreads,
                    librarything:
                        config.features?.export?.options?.librarything ??
                        defaultBookBatClientConfig.features.export.options
                            .librarything,
                },
            },
            load: {
                enabled:
                    config.features?.load?.enabled ??
                    defaultBookBatClientConfig.features.load.enabled,
            },
        },
    };
}
