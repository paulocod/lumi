export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciais inválidas');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailInUseError extends Error {
  constructor() {
    super('Email já está em uso');
    this.name = 'EmailInUseError';
  }
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Token inválido ou expirado');
    this.name = 'TokenExpiredError';
  }
}
