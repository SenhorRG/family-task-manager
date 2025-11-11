import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class AppLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AppLoggerInterceptor.name);

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);
    if (body && Object.keys(body).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        this.logger.log(`Response: ${method} ${url} - ${statusCode} - ${responseTime}ms`);
      }),
    );
  }
}
