export type MetricName =
  | 'command_duration_ms'
  | 'query_duration_ms'
  | 'version_conflicts'
  | 'idempotency_replays'
  | 'outbox_published'
  | 'outbox_failed'
  | 'engine_errors'
  | 'infra_errors'
  | 'http_requests'
  | 'http_errors'

export interface MetricSample {
  name: MetricName
  value: number
  labels: Record<string, string>
  at: Date
}

/**
 * Registro de métricas en memoria (exportable a Prometheus/etc. después).
 */
export class MetricsRegistry {
  private readonly counters = new Map<string, number>()
  private readonly samples: MetricSample[] = []

  increment(
    name: MetricName,
    labels: Record<string, string> = {},
    by = 1,
  ): void {
    const key = this.key(name, labels)
    this.counters.set(key, (this.counters.get(key) ?? 0) + by)
    this.samples.push({ name, value: by, labels, at: new Date() })
  }

  observe(
    name: MetricName,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    const key = this.key(name, labels)
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1)
    this.samples.push({ name, value, labels, at: new Date() })
  }

  getCounter(name: MetricName, labels: Record<string, string> = {}): number {
    return this.counters.get(this.key(name, labels)) ?? 0
  }

  snapshot(): {
    counters: Record<string, number>
    recentSamples: MetricSample[]
  } {
    return {
      counters: Object.fromEntries(this.counters.entries()),
      recentSamples: this.samples.slice(-100),
    }
  }

  reset(): void {
    this.counters.clear()
    this.samples.length = 0
  }

  private key(name: MetricName, labels: Record<string, string>): string {
    const labelPart = Object.keys(labels)
      .sort()
      .map((k) => `${k}=${labels[k]}`)
      .join(',')
    return labelPart ? `${name}{${labelPart}}` : name
  }
}

export const metricsRegistry = new MetricsRegistry()
