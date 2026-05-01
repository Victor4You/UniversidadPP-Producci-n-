// src/users/user.entity.ts
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Post } from '../posts/entities/post.entity';

@Entity('users')
export class User {
  @PrimaryColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  name!: string; // Esta es la columna 'name' de tu DB

  @Column()
  email!: string;

  @Column({ default: 'user' })
  role!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: 0 })
  puntos: number;

  @Column({ default: 0 })
  creditosTotales: number;

  // --- AGREGAR ESTAS COLUMNAS PARA EVITAR EL ERROR ---
  @Column({ select: false, nullable: true })
  sucursal?: string;

  @Column({ name: 'departamento', nullable: true })
  departamento?: string;
  // --------------------------------------------------

  @OneToMany(() => Post, (post) => post.user)
  posts?: Post[];
}
