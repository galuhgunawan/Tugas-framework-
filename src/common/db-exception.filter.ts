import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/** Mengubah error constraint PostgreSQL menjadi respons HTTP yang jelas. */
@Catch(QueryFailedError)
export class DbExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError & { code?: string; detail?: string }, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case '23505': // unique_violation
        status = HttpStatus.CONFLICT;
        message = `Data duplikat: ${exception.detail ?? 'unique constraint dilanggar'}`;
        break;
      case '23503': // foreign_key_violation
        status = HttpStatus.CONFLICT;
        message = `Relasi tidak valid / data masih dipakai: ${exception.detail ?? ''}`;
        break;
      case '23514': // check_violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Nilai melanggar aturan constraint (mis. stok/harga negatif).';
        break;
      case '22P02': // invalid_text_representation (mis. UUID salah)
        status = HttpStatus.BAD_REQUEST;
        message = 'Format data tidak valid.';
        break;
    }
    res.status(status).json({ statusCode: status, message, error: 'DatabaseError' });
  }
}
