import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bounty } from './bounty.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bountyId: string;

  @ManyToOne(() => Bounty, (bounty) => bounty.submissions, { onDelete: 'CASCADE' })
  bounty: Bounty;

  @Column()
  contributorAddress: string;

  @Column()
  link: string;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status: SubmissionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
