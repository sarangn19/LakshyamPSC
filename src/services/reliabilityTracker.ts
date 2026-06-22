export interface MetricsSnapshot {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  providerFailures: Record<string, number>;
  rateLimitCount: number;
  fallbackCount: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  queueLength: number;
  cacheSize: number;
  windowStart: number;
  windowEnd: number;
}

class ReliabilityTracker {
  private latencies: number[] = [];
  private providerFailures: Record<string, number> = {};
  private cacheHits = 0;
  private cacheMisses = 0;
  private rateLimitCount = 0;
  private fallbackCount = 0;
  private totalRequests = 0;
  private successfulRequests = 0;
  private windowStart = Date.now();

  private maxSamples = 10000;

  recordLatency(ms: number): void {
    this.latencies.push(ms);
    if (this.latencies.length > this.maxSamples) {
      this.latencies = this.latencies.slice(-this.maxSamples);
    }
  }

  recordSuccess(): void {
    this.totalRequests++;
    this.successfulRequests++;
  }

  recordFailure(provider?: string, statusCode?: number): void {
    this.totalRequests++;
    if (provider) {
      const key = `${provider}${statusCode ? `_${statusCode}` : ''}`;
      this.providerFailures[key] = (this.providerFailures[key] || 0) + 1;
    }
    if (statusCode === 429) {
      this.rateLimitCount++;
    }
  }

  recordRateLimit(): void {
    this.rateLimitCount++;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  recordFallback(): void {
    this.fallbackCount++;
  }

  getMetrics(): MetricsSnapshot {
    const failedRequests = this.totalRequests - this.successfulRequests;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const len = sorted.length;
    const avg = len > 0 ? sorted.reduce((s, v) => s + v, 0) / len : 0;
    const median = len > 0 ? sorted[Math.floor(len * 0.5)] : 0;
    const p95 = len > 0 ? sorted[Math.floor(len * 0.95)] : 0;
    const p99 = len > 0 ? sorted[Math.floor(len * 0.99)] : 0;
    const cacheTotal = this.cacheHits + this.cacheMisses;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests,
      successRate: this.totalRequests > 0 ? this.successfulRequests / this.totalRequests : 0,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: cacheTotal > 0 ? this.cacheHits / cacheTotal : 0,
      providerFailures: { ...this.providerFailures },
      rateLimitCount: this.rateLimitCount,
      fallbackCount: this.fallbackCount,
      avgLatencyMs: Math.round(avg),
      medianLatencyMs: median,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      queueLength: 0,
      cacheSize: 0,
      windowStart: this.windowStart,
      windowEnd: Date.now(),
    };
  }

  resetWindow(): void {
    this.latencies = [];
    this.providerFailures = {};
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.rateLimitCount = 0;
    this.fallbackCount = 0;
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.windowStart = Date.now();
  }
}

export const reliabilityTracker = new ReliabilityTracker();
