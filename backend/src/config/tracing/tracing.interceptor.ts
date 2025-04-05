import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  trace,
  SpanStatusCode,
  context as otelContext,
} from '@opentelemetry/api';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IUser } from './tracing.types';

interface RouteInfo {
  path: string;
}

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('http-tracer');

  constructor(private readonly configService: ConfigService) {}

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = executionContext.switchToHttp().getRequest<Request>();
    const response = executionContext.switchToHttp().getResponse<Response>();
    const method = request.method;
    const url = request.url;
    const route = (request.route as RouteInfo)?.path || url;

    const span = this.tracer.startSpan(`${method} ${route}`, {
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.route': route,
        'http.host': request.headers.host,
        'http.user_agent': request.headers['user-agent'],
        'http.request_content_length': request.headers['content-length'],
        'http.request_content_type': request.headers['content-type'],
        'http.query_params': JSON.stringify(request.query),
        'http.request_body': this.sanitizeBody(request.body),
        'http.user_id': (request.user as IUser)?.id,
        'http.user_email': (request.user as IUser)?.email,
        'service.name': this.configService.get<string>('tracing.service.name'),
        'service.version': this.configService.get<string>(
          'tracing.service.version',
        ),
        'service.environment':
          this.configService.get<string>('app.environment'),
      },
    });

    const startTime = Date.now();

    return new Observable((subscriber) => {
      otelContext.with(trace.setSpan(otelContext.active(), span), () => {
        next
          .handle()
          .pipe(
            tap({
              next: (data) => {
                span.setAttributes({
                  'http.status_code': response.statusCode,
                  'http.response_content_length':
                    response.get('content-length'),
                  'http.response_content_type': response.get('content-type'),
                  'http.response_body': this.sanitizeBody(data),
                  'http.duration_ms': Date.now() - startTime,
                });

                if (response.statusCode >= 400) {
                  span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: `HTTP ${response.statusCode}`,
                  });
                }

                span.end();
              },
              error: (error: Error) => {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: error.message,
                });
                span.setAttributes({
                  'error.type': error.name,
                  'error.message': error.message,
                  'error.stack': error.stack,
                });
                span.end();
              },
            }),
          )
          .subscribe(subscriber);
      });
    });
  }

  private sanitizeBody(body: unknown): string {
    if (!body) return '';

    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    const sanitized = { ...(body as Record<string, unknown>) };

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return JSON.stringify(sanitized);
  }
}
