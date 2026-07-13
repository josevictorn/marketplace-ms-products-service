import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDurationMicroseconds: promClient.Histogram<string>;
  private readonly httpRequestsTotal: promClient.Counter<string>;

  constructor() {
    promClient.collectDefaultMetrics();

    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDurationMicroseconds = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5, 10],
    });
  }

  getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }

  incrementHttpRequestCount(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  observeHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ) {
    this.httpRequestDurationMicroseconds.observe(
      { method, route, status_code: statusCode },
      durationSeconds,
    );
  }
}
