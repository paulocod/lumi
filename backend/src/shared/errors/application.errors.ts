export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PdfProcessingError extends ApplicationError {
  constructor(message: string) {
    super(message, 'PDF_PROCESSING_ERROR', 400);
  }
}

export class PdfValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'PDF_VALIDATION_ERROR', 400);
  }
}

export class QueueProcessingError extends ApplicationError {
  constructor(message: string) {
    super(message, 'QUEUE_PROCESSING_ERROR', 500);
  }
}

export class InvoiceNotFoundError extends ApplicationError {
  constructor(invoiceId: string) {
    super(`Fatura não encontrada: ${invoiceId}`, 'INVOICE_NOT_FOUND', 404);
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class CacheError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR', 500);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
