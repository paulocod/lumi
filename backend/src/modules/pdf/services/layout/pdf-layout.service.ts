import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@/config/logger';
import { PdfLayout, PdfLayoutRegistry } from '../../types/pdf-types';

@Injectable()
export class PdfLayoutService implements OnModuleInit {
  private layouts: PdfLayoutRegistry = {};

  constructor(private readonly logger: LoggerService) {}

  onModuleInit() {
    this.logger.debug('Inicializando serviço de layouts de PDF');
  }

  registerLayout<T>(layout: PdfLayout<T>): void {
    if (this.layouts[layout.name]) {
      this.logger.warn(`Layout ${layout.name} já registrado, substituindo...`);
    }

    this.layouts[layout.name] = layout;
    this.logger.debug(`Layout ${layout.name} registrado com sucesso`);
  }

  getLayout<T>(name: string): PdfLayout<T> | undefined {
    return this.layouts[name] as PdfLayout<T>;
  }

  getAllLayouts(): PdfLayoutRegistry {
    return { ...this.layouts };
  }

  hasLayout(name: string): boolean {
    return !!this.layouts[name];
  }
}
