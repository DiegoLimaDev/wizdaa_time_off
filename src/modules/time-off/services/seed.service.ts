import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeOffBalance } from '../entities/time-off-balance.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(TimeOffBalance)
    private readonly balanceRepository: Repository<TimeOffBalance>,
  ) {}

  async onModuleInit() {
    await this.seedBalances();
  }

  private async seedBalances() {
    const count = await this.balanceRepository.count();

    if (count > 0) {
      this.logger.log('Database already has data. Skipping seed.');
      return;
    }

    this.logger.log('Seeding initial time-off balances...');

    // We create a default employee for testing purposes
    const seedData = [
      {
        employeeId: 'diego-123',
        locationId: 'brazil-office',
        availableDays: 15.0,
      },
      {
        employeeId: 'readyon-user',
        locationId: 'us-office',
        availableDays: 10.5,
      },
    ];

    await this.balanceRepository.save(seedData);
    this.logger.log('Seed completed successfully.');
  }
}
