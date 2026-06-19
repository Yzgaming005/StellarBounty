import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { StellarRpcClient } from './stellar-rpc-client';

const mockServerA = {
  getAccount: jest.fn(),
  prepareTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  getHealth: jest.fn(),
  getNetwork: jest.fn(),
};
const mockServerB = {
  getAccount: jest.fn(),
  prepareTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  getHealth: jest.fn(),
  getNetwork: jest.fn(),
};

jest.mock('@stellar/stellar-sdk', () => ({
  rpc: {
    Server: jest
      .fn()
      .mockImplementationOnce(() => mockServerA)
      .mockImplementationOnce(() => mockServerB),
  },
}));

describe('StellarRpcClient', () => {
  let config: { get: jest.Mock };
  let metrics: { recordStellarRpcCall: jest.Mock };
  let client: StellarRpcClient;

  function buildClient(rpcConfig: Record<string, string | undefined>): StellarRpcClient {
    config = {
      get: jest.fn((key: string, defaultValue?: unknown) =>
        rpcConfig[key] !== undefined ? rpcConfig[key] : defaultValue,
      ),
    };
    metrics = { recordStellarRpcCall: jest.fn() };
    const c = new StellarRpcClient(
      config as unknown as ConfigService,
      metrics as unknown as MetricsService,
    );
    return c;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockServerA.getAccount.mockReset();
    mockServerA.prepareTransaction.mockReset();
    mockServerA.sendTransaction.mockReset();
    mockServerA.getHealth.mockReset();
    mockServerA.getNetwork.mockReset();
    mockServerB.getAccount.mockReset();
    mockServerB.prepareTransaction.mockReset();
    mockServerB.sendTransaction.mockReset();
    mockServerB.getHealth.mockReset();
    mockServerB.getNetwork.mockReset();
  });

  describe('URL resolution', () => {
    it('uses STELLAR_RPC_URLS (comma-separated) when set', async () => {
      client = buildClient({
        STELLAR_RPC_URLS: 'https://a.example.com, https://b.example.com',
      });
      await client.onModuleInit();
      const snap = client.getHealthSnapshot();
      expect(snap.map((s) => s.url)).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ]);
    });

    it('falls back to STELLAR_RPC_URL when STELLAR_RPC_URLS is unset', async () => {
      client = buildClient({
        STELLAR_RPC_URL: 'https://single.example.com',
      });
      await client.onModuleInit();
      expect(client.getHealthSnapshot().map((s) => s.url)).toEqual([
        'https://single.example.com',
      ]);
    });

    it('falls back to network default when neither set', async () => {
      client = buildClient({});
      await client.onModuleInit();
      const urls = client.getHealthSnapshot().map((s) => s.url);
      expect(urls).toHaveLength(1);
      expect(urls[0]).toMatch(/stellar\.org|validationcloud/);
    });
  });

  describe('execute()', () => {
    it('returns the result of the first healthy endpoint', async () => {
      client = buildClient({
        STELLAR_RPC_URLS: 'https://a.example.com,https://b.example.com',
      });
      await client.onModuleInit();
      const fn = jest.fn().mockResolvedValue('ok-result');
      const result = await client.execute(fn);
      expect(result.value).toBe('ok-result');
      expect(result.rpcUrl).toBe('https://a.example.com');
      expect(result.attempts).toBe(1);
    });

    it('fails over to the next endpoint when the first throws', async () => {
      client = buildClient({
        STELLAR_RPC_URLS: 'https://a.example.com,https://b.example.com',
      });
      await client.onModuleInit();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('first fails'))
        .mockResolvedValueOnce('second-ok');
      const result = await client.execute(fn, { retriesPerEndpoint: 0 });
      expect(result.value).toBe('second-ok');
      expect(result.rpcUrl).toBe('https://b.example.com');
      expect(metrics.recordStellarRpcCall).toHaveBeenCalledWith(
        expect.objectContaining({ rpcUrl: 'https://a.example.com', failed: true }),
      );
    });

    it('throws when all endpoints fail', async () => {
      client = buildClient({
        STELLAR_RPC_URLS: 'https://a.example.com,https://b.example.com',
      });
      await client.onModuleInit();
      const fn = jest.fn().mockRejectedValue(new Error('boom'));
      await expect(
        client.execute(fn, { retriesPerEndpoint: 0, timeoutMs: 1000 }),
      ).rejects.toThrow(/All 2 Stellar RPC endpoint\(s\) failed/);
    });

    it('throws when no endpoints are configured', async () => {
      client = buildClient({ STELLAR_RPC_URLS: '  ,  ,' });
      await client.onModuleInit();
      const fn = jest.fn();
      // resolveUrls trims empty entries; we still get fallback network URL
      // To force "no endpoints", use a custom trick: clear the endpoints list.
      (client as unknown as { endpoints: unknown[] }).endpoints = [];
      await expect(client.execute(fn)).rejects.toThrow(/No Stellar RPC endpoints configured/);
    });

    it('marks endpoint unhealthy after a failure and returns to healthy on subsequent success', async () => {
      client = buildClient({
        STELLAR_RPC_URLS: 'https://a.example.com,https://b.example.com',
      });
      await client.onModuleInit();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('down'))
        .mockResolvedValueOnce('recovered');
      await client.execute(fn, { retriesPerEndpoint: 0 });
      const snap = client.getHealthSnapshot();
      const a = snap.find((e) => e.url === 'https://a.example.com')!;
      expect(a.healthy).toBe(false);
      const b = snap.find((e) => e.url === 'https://b.example.com')!;
      expect(b.healthy).toBe(true);
    });
  });

  describe('timeout', () => {
    it('rejects with timeout error when call exceeds timeoutMs', async () => {
      client = buildClient({
        STELLAR_RPC_URLS: 'https://a.example.com',
      });
      await client.onModuleInit();
      const fn = () => new Promise((resolve) => setTimeout(() => resolve('late'), 500));
      await expect(
        client.execute(fn, { timeoutMs: 50, retriesPerEndpoint: 0 }),
      ).rejects.toThrow(/timed out/);
    });
  });
});
