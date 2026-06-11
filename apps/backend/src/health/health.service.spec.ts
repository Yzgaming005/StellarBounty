import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let dataSource: Pick<DataSource, 'query'>;
  let service: HealthService;

  beforeEach(() => {
    dataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    service = new HealthService(dataSource as DataSource);
  });

  it('returns connected database status when SELECT 1 succeeds', async () => {
    const health = await service.getHealth();

    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(health).toMatchObject({
      status: 'ok',
      database: 'connected',
      environment: expect.any(String),
      version: '0.1.0',
    });
    expect(health.timestamp).toEqual(expect.any(String));
    expect(health.uptime).toEqual(expect.any(Number));
  });

  it('returns disconnected database status without throwing when query fails', async () => {
    jest.spyOn(dataSource, 'query').mockRejectedValueOnce(new Error('connection refused'));

    await expect(service.getHealth()).resolves.toMatchObject({
      status: 'degraded',
      database: 'disconnected',
    });
  });
});
