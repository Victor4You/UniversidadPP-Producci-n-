// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { CoursesModule } from './courses/courses.module';
import { ReportsModule } from './reports/reports.module';
import { PostsModule } from './posts/posts.module';
import { SettingsModule } from './settings/settings.module';

// Entidades
import { User } from './users/user.entity';
import { Course } from './courses/entities/course.entity';
import { CourseCompletion } from './courses/entities/course-completion.entity';
import { CourseEnrollment } from './courses/entities/course-enrollment.entity';
import { CourseSection } from './courses/entities/course-section.entity';
import { CourseProgress } from './courses/entities/course-progress.entity';
import { Post } from './posts/entities/post.entity';
import { Comment } from './posts/entities/comment.entity';
import { Setting } from './settings/entities/setting.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isVercel = config.get('VERCEL') === '1' || !!process.env.VERCEL;
        const isProduction = config.get('NODE_ENV') === 'production' || isVercel;
        const shouldSSl = isVercel || config.get('DB_SSL') === 'true';

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT') || 5432,
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          entities: [
            User, Course, CourseSection, CourseCompletion,
            CourseEnrollment, CourseProgress, Post, Comment, Setting
          ],
          autoLoadEntities: true,
          synchronize: !isProduction,
          ssl: shouldSSl ? { rejectUnauthorized: false } : false,
          extra: shouldSSl ? { ssl: { rejectUnauthorized: false } } : {},
        };
      },
    }),

    // --- AGREGADO: Registro de User ---
    // Como no existe UsersModule, registramos la entidad aquí para que 
    // CoursesService (y el controlador de users) puedan usar su Repositorio.
    TypeOrmModule.forFeature([User]), 

    AuthModule,
    CoursesModule,
    PostsModule,
    ReportsModule,
    SettingsModule,
  ],
  controllers: [UsersController],
  providers: [],
})
export class AppModule {}
