// src/courses/courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
  Res,
  Headers,
  BadRequestException,
  SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import type { Response } from 'express';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}


   @Get('completed-details/:userId')
async getCompletedDetails(@Param('userId') userId: string) {
  // Este método ya existe en tu service (según el contexto), solo falta exponerlo
  return this.coursesService.getCompletedCourseDetails(userId);
}

  // --- BÚSQUEDA Y FILTROS (PERSISTENCIA EN BD) ---
  @Get('users/search')
  async searchUsers(
    @Query('sucursalId') sucursalId?: string,
    @Query('grupoId') grupoId?: string,
    @Query('puesto') puesto?: string,
    @Query('q') query?: string,
  ) {
    return this.coursesService.findUsersByFilters({
      sucursalId,
      grupoId,
      puesto,
      query,
    });
  }

  @Get('branches/list')
  async getAllBranches() {
    return this.coursesService.findAllBranches();
  }

  @Get('groups/list')
  async getAllGroups() {
    return this.coursesService.findAllGroups();
  }

  @Get('positions/list')
  async getAllPositions() {
    return this.coursesService.findAllPositions();
  }

  // --- CONFIGURACIONES (CATEGORÍAS) ---
  @Get('categories')
  async getCategories() {
    const categories = await this.coursesService.findSettings('course_categories');
    return categories || [];
  }

  @Post('categories')
  async updateCategories(@Body() categories: string[]) {
    return await this.coursesService.updateSettings({
      key: 'course_categories',
      value: categories,
    });
  }

  // --- PROGRESO Y FINALIZACIÓN (SIN LOCALSTORAGE) ---
  // El progreso se guarda directamente en la base de datos cada vez que el usuario avanza
  @Post('save-progress')
  async saveProgress(@Body() data: any) {
    return this.coursesService.saveProgress(data);
  }

  @Get('user-progress')
  async getUserProgress(
    @Query('userId') userId: string,
    @Query('courseId') courseId?: string,
  ) {
    if (!userId) throw new BadRequestException('userId es requerido');
    
    if (courseId) {
      // Retorna el progreso específico (ej. slides vistos, tiempo)
      return this.coursesService.getProgress(Number(userId), Number(courseId));
    }
    // Si no hay courseId, retorna los IDs de cursos completados por el usuario
    return await this.coursesService.getCompletedCourseIds(userId);
  }

  @Post('register-completion')
  async registerCompletion(@Body() completionData: any) {
    const { userId, courseId, respuestas, survey } = completionData;
    return this.coursesService.registerCompletion(
      userId,
      courseId,
      respuestas,
      survey
    );
  }

  // --- INSCRIPCIONES Y ESTADOS ---
  @Get('enrollments/user/:userId')
  async getUserEnrollments(@Param('userId') userId: string) {
    return await this.coursesService.getEnrollmentsByUser(userId);
  }

  @Get('enrollment-status')
  async getEnrollmentStatus(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.coursesService.getEnrollmentStatus(userId, courseId);
  }

  @Patch('enrollments/:userId/:courseId/reset')
  async resetEnrollment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.coursesService.resetEnrollment(userId, courseId);
  }

  // --- DOCUMENTOS Y REPORTES ---
  @Get('diploma/:userId/:courseId')
async downloadDiploma(
  @Param('userId', ParseIntPipe) userId: number,
  @Param('courseId', ParseIntPipe) courseId: number,
  @Res() res: Response, // Asegúrate de que 'Response' venga de 'express'
) {
  // QUITAMOS EL "return". Solo llamamos al servicio.
  await this.coursesService.generateDiplomaPdf(userId, courseId, res);
}
  @Post('kardex/:userId')
  async getKardex(
    @Param('userId', ParseIntPipe) userId: number,
    @Res() res: Response,
  ) {
    try {
      // 1. Pasamos 'res' como segundo argumento para corregir el error TS2554
      // 2. No asignamos a una variable pdfBuffer porque el servicio ya hace el res.send/res.set
      // Esto corrige el error TS2339 (length on void)
      await this.coursesService.generateKardex(userId, res);
      
    } catch (error) {
      // 3. Usamos console.error o un logger local para evitar el error TS2341 (logger privado)
      console.error(`Error al generar Kardex: ${error.message}`);
      
      // Verificamos si los headers ya se enviaron para evitar errores de Express
      if (!res.headersSent) {
        return res.status(500).json({
          message: 'No se pudo generar el Kardex en este momento.',
          error: error.message
        });
      }
    }
  }  

  @Get('reports/stats')
  async getStats() {
    return this.coursesService.getRealReportStats();
  }

  // --- GESTIÓN DE CURSOS (CRUD) ---
  @Get()
  async findAll(
    @Query('categoria') categoria?: string,
    @Query('estado') estado?: string,
  ) {
    return this.coursesService.findAll({ categoria, estado });
  }

  @Post()
  async create(@Body() courseData: any) {
    return this.coursesService.create(courseData);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    return this.coursesService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    // Siguiendo tu lógica de borrado lógico
    return this.coursesService.update(id, { estado: 'inactivo' });
  }

  // --- ARCHIVOS Y ASISTENCIA ---
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  limits: {
   fileSize: 1024 * 1024 * 2000
  },
}))
async uploadFile(@UploadedFile() file: any) {
  return this.coursesService.uploadFileToBlob(file);
}
@Post('qr-attendance') // Esta es la ruta: /v1/courses/qr-attendance
async registerQR(@Body() data: { qrToken: string; username: string }) {
  // Validamos que vengan los datos
  if (!data.qrToken || !data.username) {
    throw new BadRequestException('Faltan datos obligatorios (token o usuario)');
  }
  return this.coursesService.registerAttendanceViaQR(data.qrToken, data.username);
}
  @Post(':id/students')
  async assignStudents(
    @Param('id') courseId: string,
    @Body('userIds') userIds: number[],
  ) {
    return this.coursesService.assignUsersToCourse(courseId, userIds);
  }

  @Get(':id/students')
  async getEnrolledStudents(@Param('id') id: string) {
    return this.coursesService.getEnrolledStudents(id);
  }
}
