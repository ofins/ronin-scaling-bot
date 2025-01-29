export class AddressService {
  private addresses: string[];

  constructor() {
    this.addresses = [
      "0xe514d9deb7966c8be0ca922de8a064264ea6bcd4",
      "0x97a9107c1793bc407d6f527b77e7fff4d812bece",
    ];
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
