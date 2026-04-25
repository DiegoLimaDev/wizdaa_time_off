// src/modules/time-off/resolvers/time-off.resolver.ts
import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { TimeOffBalance } from '../entities/time-off-balance.entity';
import { TimeOffRequest } from '../entities/time-off-request.entity';
import { TimeOffStatus } from '../enums/time-off-status.enum';
import { CreateTimeOffInput } from '../dto/create-time-off.input';
import { TimeOffReadService } from '../services/time-off.read.service';
import { TimeOffMutationService } from '../services/time-off.mutation.service';
import { SyncBalanceInput } from '../../sync/dto/sync-balance.dto';

@Resolver()
export class TimeOffResolver {
  constructor(
    // Injeção da dupla dinâmica
    private readonly readService: TimeOffReadService,
    private readonly mutationService: TimeOffMutationService,
  ) {}

  // --- QUERIES (Consomem o ReadService) ---

  @Query(() => TimeOffBalance, { name: 'balance' })
  async getBalance(
    @Args('employeeId') employeeId: string,
    @Args('locationId') locationId: string,
  ) {
    return this.readService.getBalance(employeeId, locationId);
  }

  @Query(() => [TimeOffRequest], { name: 'requests' })
  async findAll(
    @Args('status', { type: () => TimeOffStatus, nullable: true })
    status?: TimeOffStatus,
  ) {
    return this.readService.findAllRequests(status);
  }

  // --- MUTATIONS (Consomem o MutationService) ---

  @Mutation(() => TimeOffRequest)
  async createRequest(@Args('input') input: CreateTimeOffInput) {
    return this.mutationService.createRequest(input);
  }

  @Mutation(() => TimeOffRequest)
  async approveRequest(@Args('id', { type: () => ID }) id: string) {
    return this.mutationService.approveRequest(id);
  }

  @Mutation(() => TimeOffRequest)
  async rejectRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
  ) {
    return this.mutationService.rejectRequest(id, reason);
  }

  @Mutation(() => Int, { name: 'syncBalancesFromHcm' })
  async syncBalancesFromHcm(
    @Args({ name: 'balances', type: () => [SyncBalanceInput] })
    balances: SyncBalanceInput[],
  ) {
    return this.mutationService.upsertBalances(balances);
  }
}
