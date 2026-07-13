import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap({
        next: () => this.recordMetrics(context, startTime),
        error: () => this.recordMetrics(context, startTime),
      }),
    );
  }

  private recordMetrics(context: ExecutionContext, startTime: number) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, route } = request;
    // se request.route.path não estiver disponível (ex: 404), usa request.url,
    // mas request.route.path é preferível para evitar alta cardinalidade.
    const path = route ? route.path : request.url;
    const statusCode = response.statusCode;

    // Ignora endpoint de métricas
    if (path === '/metrics') {
      return;
    }

    const durationSeconds = (Date.now() - startTime) / 1000;

    this.metricsService.incrementHttpRequestCount(method, path, statusCode);
    this.metricsService.observeHttpRequestDuration(
      method,
      path,
      statusCode,
      durationSeconds,
    );
  }
}
