export const LOCAL_API_BASE = "http://localhost:8080/v1"

export const DEFAULT_PROVIDER = "pearai" as const

export const USE_LOCAL_PROVIDER = true
export const ENABLE_REMOTE_PEAR = false
export const ENABLE_PEAR_EXTENSION_INTEGRATION = false

export const ENABLE_TELEMETRY = false

export const LOCAL_API_KEY_FALLBACK = "local"

export const LOCAL_API_ORIGIN = new URL(LOCAL_API_BASE).origin
