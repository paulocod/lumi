export class Invoice {
  id: string;
  clientNumber: string;
  referenceMonth: Date;
  electricityQuantity: number;
  electricityValue: number;
  sceeQuantity: number;
  sceeValue: number;
  compensatedEnergyQuantity: number;
  compensatedEnergyValue: number;
  publicLightingContribution: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Invoice>) {
    Object.assign(this, data);
  }

  get totalConsumption(): number {
    return this.electricityQuantity + this.sceeQuantity;
  }

  get totalValueWithoutGD(): number {
    return (
      this.electricityValue + this.sceeValue + this.publicLightingContribution
    );
  }

  get economyGD(): number {
    return this.compensatedEnergyValue;
  }
}
