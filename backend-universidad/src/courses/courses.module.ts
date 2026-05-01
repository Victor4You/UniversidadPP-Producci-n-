// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { CourseCompletion } from './entities/course-completion.entity';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { CourseProgress } from './entities/course-progress.entity';
import { User } from '../users/user.entity'; // Importación directa de la entidad
import { Setting } from '../settings/entities/setting.entity'; 
import { ReportsService } from '../reports/reports.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseCompletion,
      CourseEnrollment,
      CourseProgress,
      User,
      Setting,
    ]),
    AuthModule,
    JwtModule.register({}),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    ReportsService,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
