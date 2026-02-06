import { describe, expect, it, vi } from 'vitest';

import { uploadToS3 } from './s3';

describe('s3 helpers', () => {
  it('builds URL without double slashes', async () => {
    const res = await uploadToS3(
      { key: 'a/b.txt', body: new Uint8Array([1]), contentType: 'text/plain' },
      {
        bucket: 'bucket',
        publicBaseUrl: 'https://example.com/',
        s3: { send: async () => {} } as any,
      }
    );

    expect(res.url).toBe('https://example.com/a/b.txt');
  });

  it('sends public-read ACL by default', async () => {
    const send = vi.fn(async () => ({}));

    await uploadToS3(
      { key: 'x.txt', body: new Uint8Array([1]), contentType: 'text/plain' },
      {
        bucket: 'bucket',
        publicBaseUrl: 'https://example.com',
        s3: { send } as any,
      }
    );

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0]![0] as any;
    const input = command.input as any;
    expect(input.ACL).toBe('public-read');
  });

  it('does not send ACL when S3_DISABLE_ACL=true', async () => {
    const send = vi.fn(async () => ({}));
    vi.stubEnv('S3_DISABLE_ACL', 'true');

    await uploadToS3(
      { key: 'x.txt', body: new Uint8Array([1]), contentType: 'text/plain' },
      {
        bucket: 'bucket',
        publicBaseUrl: 'https://example.com',
        s3: { send } as any,
      }
    );

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0]![0] as any;
    const input = command.input as any;
    expect(input.ACL).toBeUndefined();

    vi.unstubAllEnvs();
  });
});
