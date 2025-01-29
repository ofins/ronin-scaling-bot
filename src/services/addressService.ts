export class AddressService {
  private addresses: string[];

  constructor() {
    this.addresses = [];
  }

  public async getActiveTradingAddresses(): Promise<string[]> {
    return this.addresses;
  }

  public async addAddress(address: string): Promise<void> {
    this.addresses.push(address);
  }

  public async removeAddress(address: string): Promise<void> {
    this.addresses = this.addresses.filter((a) => a !== address);
  }

  public async updateAddresses(addresses: string[]): Promise<void> {
    this.addresses = addresses;
  }
}
