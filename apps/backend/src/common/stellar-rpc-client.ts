import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { MetricsService } from '../metrics/metrics.service';

export type RpcCallOptions = {
  /** Per-RPC timeout in ms. Default: 5000 */
  timeoutMs?: number;
  /** Number of retries per RPC. Default: 1 */
  retriesPerEndpoint?: number;
};

export type RpcCallResult<T> = {
  value: T;
  rpcUrl: string;
  attempts: number;
};

export type RpcHealth = {
  url: string;
  healthy: boolean;
  lastCheckedAt: number;
  lastError?: string;
};

const DEFAULT_HEALTHCHECK_TIMEOUT_MS = 3000;
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 1;

/**
 * Multi-URL Stellar RPC client with automatic failover.
 *
 * Accepts a list of RPC URLs (priority order) and tries each in sequence
 * when an RPC call fails. Failed endpoints are marked unhealthy and
 * periodically re-checked; recovered endpoints are returned to the pool.
 *
 * Configuration:
 *   STELLAR_RPC_URLS=https://rpc1.example.com,https://rpc2.example.com
 *
 * If STELLAR_RPC_URLS is not set, falls back to STELLAR_RPC_URL (single URL).
 * If neither is set, defaults to the standard public endpoints based on
 * STELLAR_NETWORK.
 */
@Injectable()
export class StellarRpcClient implements OnModuleInit {
  private readonly logger = new Logger(StellarRpcClient.name);
  private readonly endpoints: RpcHealth[] = [];
  private readonly healthcheckIntervalMs: number;
  private healthcheckTimer?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {
    this.healthcheckIntervalMs =
      this.config.get<number>('STELLAR_RPC_HEALTHCHECK_INTERVAL_MS') ?? 30000;
  }

  async onModuleInit(): Promise<void> {
    const urls = this.resolveUrls();
    this.endpoints.push(
      ...urls.map((url) => ({
        url,
        healthy: true,
        lastCheckedAt: 0,
      })),
    );
    // Initial health check (non-blocking)
    void this.checkAllHealth().catch((err) => {
      this.logger.warn(`Initial RPC health check failed: ${String(err)}`);
    });
    // Periodic re-check of unhealthy endpoints
    this.healthcheckTimer = setInterval(() => {
      void this.recheckUnhealthy().catch(() => undefined);
    }, this.healthcheckIntervalMs);
    // Don't keep the process alive solely for health checks
    if (typeof this.healthcheckTimer.unref === 'function') {
      this.healthcheckTimer.unref();
    }
    this.logger.log(
      `StellarRpcClient initialized with ${this.endpoints.length} endpoint(s): ${urls.join(', ')}`,
    );
  }

  /**
   * Execute an RPC call with automatic failover across all configured endpoints.
   * Throws if ALL endpoints fail.
   */
  async execute<T>(
    fn: (server: StellarSdk.rpc.Server) => Promise<T>,
    options: RpcCallOptions = {},
  ): Promise<RpcCallResult<T>> {
    if (this.endpoints.length === 0) {
      throw new Error('No Stellar RPC endpoints configured');
    }
    const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const retries = options.retriesPerEndpoint ?? DEFAULT_RETRIES;
    const errors: Array<{ url: string; error: string }> = [];
    let attempts = 0;
    for (const endpoint of this.endpoints) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        attempts++;
        try {
          const server = new StellarSdk.rpc.Server(endpoint.url, { allowHttp: false });
          const value = await this.withTimeout(fn(server), timeoutMs);
          // Successful call — ensure endpoint is marked healthy
          this.markHealthy(endpoint);
          return { value, rpcUrl: endpoint.url, attempts };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push({ url: endpoint.url, error: message });
          this.markUnhealthy(endpoint, message);
          this.metrics.recordStellarRpcCall({
            rpcUrl: endpoint.url,
            failed: true,
          });
          this.logger.warn(
            `Stellar RPC call failed (url=${endpoint.url}, attempt=${attempt + 1}/${retries + 1}): ${message}`,
          );
        }
      }
    }
    const allFailed = new Error(
      `All ${this.endpoints.length} Stellar RPC endpoint(s) failed: ${errors
        .map((e) => `${e.url}: ${e.error}`)
        .join('; ')}`,
    );
    throw allFailed;
  }

  /**
   * Return a snapshot of endpoint health (for observability/tests).
   */
  getHealthSnapshot(): RpcHealth[] {
    return this.endpoints.map((e) => ({ ...e }));
  }

  /**
   * Return the next healthy endpoint URL, or undefined if all are unhealthy.
   */
  getNextHealthyUrl(): string | undefined {
    return this.endpoints.find((e) => e.healthy)?.url;
  }

  onModuleDestroy(): void {
    if (this.healthcheckTimer) {
      clearInterval(this.healthcheckTimer);
      this.healthcheckTimer = undefined;
    }
  }

  private async checkAllHealth(): Promise<void> {
    await Promise.all(
      this.endpoints.map((endpoint) =>
        this.checkHealth(endpoint).catch(() => undefined),
      ),
    );
  }

  private async recheckUnhealthy(): Promise<void> {
    const unhealthy = this.endpoints.filter((e) => !e.healthy);
    if (unhealthy.length === 0) return;
    await Promise.all(
      unhealthy.map((endpoint) =>
        this.checkHealth(endpoint).catch(() => undefined),
      ),
    );
    const recovered = unhealthy.filter((e) => e.healthy).map((e) => e.url);
    if (recovered.length > 0) {
      this.logger.log(`Stellar RPC endpoint(s) recovered: ${recovered.join(', ')}`);
    }
  }

  private async checkHealth(endpoint: RpcHealth): Promise<void> {
    const server = new StellarSdk.rpc.Server(endpoint.url, { allowHttp: false });
    try {
      await this.withTimeout(
        // getHealth is part of the public RPC API; if unsupported by an
        // older endpoint, fall back to a no-op getNetwork() probe.
        (server as unknown as { getHealth?: () => Promise<unknown> }).getHealth?.() ??
          server.getNetwork(),
        DEFAULT_HEALTHCHECK_TIMEOUT_MS,
      );
      this.markHealthy(endpoint);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.markUnhealthy(endpoint, message);
    }
  }

  private markHealthy(endpoint: RpcHealth): void {
    const wasUnhealthy = !endpoint.healthy;
    endpoint.healthy = true;
    endpoint.lastCheckedAt = Date.now();
    endpoint.lastError = undefined;
    if (wasUnhealthy) {
      this.logger.log(`Stellar RPC endpoint healthy again: ${endpoint.url}`);
    }
  }

  private markUnhealthy(endpoint: RpcHealth, error: string): void {
    const wasHealthy = endpoint.healthy;
    endpoint.healthy = false;
    endpoint.lastCheckedAt = Date.now();
    endpoint.lastError = error;
    if (wasHealthy) {
      this.logger.warn(
        `Stellar RPC endpoint marked unhealthy: ${endpoint.url} (error: ${error})`,
      );
    }
  }

  private resolveUrls(): string[] {
    const multi = this.config.get<string>('STELLAR_RPC_URLS');
    if (multi && multi.trim().length > 0) {
      return multi
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
    }
    const single = this.config.get<string>('STELLAR_RPC_URL');
    if (single && single.trim().length > 0) {
      return [single.trim()];
    }
    const network = this.config.get<string>('STELLAR_NETWORK', 'testnet');
    return [
      network === 'mainnet'
        ? 'https://mainnet.stellar.validationcloud.io/v1/rpc'
        : 'https://soroban-testnet.stellar.org',
    ];
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Stellar RPC call timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
