import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string; // Ej: 'home_config'

  @Column({ type: 'jsonb', nullable: true })
  value: any; 
}
