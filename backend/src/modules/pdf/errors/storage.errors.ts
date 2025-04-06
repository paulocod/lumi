export class MinioStorageError extends Error {
  constructor(
    public readonly operation: string,
    public readonly details: string,
    public readonly originalError?: unknown,
  ) {
    super(`Erro na operação ${operation}: ${details}`);
    this.name = 'MinioStorageError';
  }
}

export class BucketOperationError extends MinioStorageError {
  constructor(bucketName: string, operation: string, originalError?: unknown) {
    super(
      'bucket',
      `Falha na operação ${operation} no bucket ${bucketName}`,
      originalError,
    );
    this.name = 'BucketOperationError';
  }
}

export class ObjectOperationError extends MinioStorageError {
  constructor(
    objectName: string,
    bucketName: string,
    operation: string,
    originalError?: unknown,
  ) {
    super(
      'object',
      `Falha na operação ${operation} do objeto ${objectName} no bucket ${bucketName}`,
      originalError,
    );
    this.name = 'ObjectOperationError';
  }
}
