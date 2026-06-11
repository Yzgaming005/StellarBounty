import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Repository } from 'typeorm';
import { Bounty } from './entities/bounty.entity';
import { Submission, SubmissionStatus } from './entities/submission.entity';
import { CreateSubmissionDto } from './submissions.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissions: Repository<Submission>,
    @InjectRepository(Bounty)
    private readonly bounties: Repository<Bounty>,
  ) {}

  async create(bountyId: string, dto: CreateSubmissionDto, contributorAddress: string) {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');

    const submission = this.submissions.create({
      bountyId,
      contributorAddress,
      link: dto.link,
    });
    return this.submissions.save(submission);
  }

  async findAll(bountyId: string, ownerAddress: string) {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.ownerAddress !== ownerAddress) throw new ForbiddenException();
    return this.submissions.find({ where: { bountyId }, order: { createdAt: 'DESC' } });
  }

  async approve(bountyId: string, subId: string, ownerAddress: string) {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.ownerAddress !== ownerAddress) throw new ForbiddenException();

    const alreadyApproved = await this.submissions.findOne({
      where: { bountyId, status: SubmissionStatus.APPROVED },
    });
    if (alreadyApproved) {
      throw new BadRequestException('A submission has already been approved for this bounty');
    }

    const submission = await this.submissions.findOne({ where: { id: subId, bountyId } });
    if (!submission) throw new NotFoundException('Submission not found');

    await this.callContractApprove(bountyId, ownerAddress);

    submission.status = SubmissionStatus.APPROVED;
    return this.submissions.save(submission);
  }

  async reject(bountyId: string, subId: string, ownerAddress: string) {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.ownerAddress !== ownerAddress) throw new ForbiddenException();

    const submission = await this.submissions.findOne({ where: { id: subId, bountyId } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status === SubmissionStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an already approved submission');
    }

    submission.status = SubmissionStatus.REJECTED;
    return this.submissions.save(submission);
  }

  private async callContractApprove(bountyId: string, ownerAddress: string): Promise<void> {
    const contractId = process.env[`SOROBAN_CONTRACT_${bountyId.toUpperCase()}`]
      ?? process.env.SOROBAN_CONTRACT_ID;
    if (!contractId) return; // no contract configured — skip (dev/test mode)

    const network = process.env.STELLAR_NETWORK ?? 'testnet';
    const rpcUrl =
      process.env.STELLAR_RPC_URL ??
      (network === 'mainnet'
        ? 'https://mainnet.stellar.validationcloud.io/v1/rpc'
        : 'https://soroban-testnet.stellar.org');

    const server = new StellarSdk.rpc.Server(rpcUrl);
    const networkPassphrase =
      network === 'mainnet'
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET;

    const account = await server.getAccount(ownerAddress);

    const contract = new StellarSdk.Contract(contractId);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call('approve', StellarSdk.nativeToScVal(ownerAddress, { type: 'address' })),
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    // The backend signs only if a server-side signing key is configured.
    const signingSecret = process.env.STELLAR_SIGNING_SECRET;
    if (signingSecret) {
      const signingKeypair = StellarSdk.Keypair.fromSecret(signingSecret);
      prepared.sign(signingKeypair);
      await server.sendTransaction(prepared);
    }
    // If no signing secret, the transaction is prepared but not submitted —
    // the client is expected to sign and submit it separately.
  }
}
