import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'jsonb', nullable: true })
  value: any;
}

