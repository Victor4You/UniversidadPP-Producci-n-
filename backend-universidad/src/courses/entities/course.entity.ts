//src/courses/entities/course.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { CourseEnrollment } from './course-enrollment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  codigo: string;

  @Column({ name: 'nombre' })
  nombre: string;

  @Column({ name: 'profesor', nullable: true })
  profesor: string;

  @Column({ name: 'instructor', nullable: true })
  instructor: string;

  @Column({ default: 0 })
  creditos: number;

  @Column({ default: '2024-I' })
  semestre: string;

  @Column({ name: 'estado', default: 'activo' })
  estado: string;

  @Column({ name: 'status', nullable: true })
  status: string;

  @Column({ name: 'categoria', nullable: true })
  categoria: string;

  @Column({ type: 'jsonb', nullable: true })
  videos: any[];

  @Column({ type: 'jsonb', nullable: true })
  pdfs: any[];

  @Column({ type: 'jsonb', nullable: true })
  questions: any[];

  // CORRECCIÓN CLAVE: La 'E' debe ser mayúscula en el name
  @Column({ name: 'duracionExamen', default: 30 })
  duracionExamen: number;

  // CORRECCIÓN CLAVE: La 'L' debe ser mayúscula en el name
  @Column({ name: 'fechaLimite', type: 'timestamp', nullable: true })
  fechaLimite: Date;

  @Column({ default: 'general' })
  tipo: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  secciones: any[];

  // CORRECCIÓN CLAVE: 'createdAt' con 'A' mayúscula
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  duracion: string;

  // CORRECCIÓN CLAVE: 'videoUrl' con 'U' mayúscula
  @Column({ name: 'videoUrl', nullable: true })
  videoUrl: string;

  // CORRECCIÓN CLAVE: 'pdfUrl' con 'U' mayúscula
  @Column({ name: 'pdfUrl', nullable: true })
  pdfUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  examen: any;
  @Column({  type: 'jsonb', nullable: true, name: 'newencuestaconfig', default: []})
  newencuestaconfig: any;

  @Column({ default: 'online' })
  modalidad: string;

  // CORRECCIÓN CLAVE: 'qrToken' con 'T' mayúscula
  @Column({ name: 'qrToken', nullable: true })
  qrToken: string;

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.course)
  estudiantesInscritos: CourseEnrollment[];
}
