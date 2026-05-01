import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from '../../users/user.entity';

@Entity('course_enrollments')
export class CourseEnrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'courseid', type: 'integer' }) // Minúscula
  courseId: number;

  @Column({ name: 'userid' }) // Minúscula
  userId: number;

  @Column({ name: 'username', nullable: true }) // Minúscula
  userName: string;

  @Column({ name: 'userusername', nullable: true }) // Minúscula
  userUsername: string;

  @CreateDateColumn({ name: 'enrolledat' }) // Minúscula
  enrolledAt: Date;

  @ManyToOne(() => Course, (course) => course.estudiantesInscritos)
  @JoinColumn({ name: 'courseid' }) 
  course: Course;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'userid', referencedColumnName: 'id' }) 
  user: User;

  @Column({ name: 'status', default: 'activo' })
  status: string;

  @Column({ name: 'intentos', default: 0 })
  intentos: number;

  @Column({ name: 'asistenciaMarcada', type: 'boolean', default: false })
  asistenciaMarcada: boolean;

  @Column({ name: 'asistencia', type: 'boolean', default: false, nullable: true })
  asistencia: boolean;
}
