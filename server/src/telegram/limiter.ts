/**
 * Concurrency limiter and FloodWait backoff handler for Telegram MTProto operations
 */

export class StreamConcurrencyLimiter {
  private activeStreams = 0;
  private readonly maxConcurrent: number;
  private queue: Array<() => void> = [];

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Acquire a slot for streaming
   */
  async acquire(): Promise<() => void> {
    if (this.activeStreams < this.maxConcurrent) {
      this.activeStreams++;
      return () => this.release();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.activeStreams++;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.activeStreams--;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  get activeCount() {
    return this.activeStreams;
  }
}

export const streamLimiter = new StreamConcurrencyLimiter(3);

/**
 * Execute an MTProto action with automatic FloodWait retry
 */
export async function withFloodWaitRetry<T>(
  action: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await action();
    } catch (err: unknown) {
      const error = err as { seconds?: number; errorMessage?: string };
      if (error && (error.seconds || error.errorMessage?.includes('FLOOD_WAIT'))) {
        const waitSeconds = error.seconds || 5;
        console.warn(`[Telegram FloodWait] Throttled. Pausing for ${waitSeconds}s...`);
        await new Promise((resolve) => setTimeout(resolve, (waitSeconds + 1) * 1000));
        attempt++;
      } else {
        throw err;
      }
    }
  }

  throw new Error('Exceeded maximum retry attempts for Telegram operation');
}
