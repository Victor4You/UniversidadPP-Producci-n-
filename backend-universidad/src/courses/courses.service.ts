// src/courses/courses.service.ts (VERSION CORREGIDA PARA VPS)registerAttendanceViaQR
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CourseCompletion } from './entities/course-completion.entity';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { Repository, In } from 'typeorm';
import axios from 'axios';
import { CourseProgress } from './entities/course-progress.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import { v4 as uuidv4 } from 'uuid'; // Asegúrate de tener uuid instalado o usa un random string
import { AuthService } from '../auth/auth.service';

import { User } from '../users/user.entity';
import { Setting } from '../settings/entities/setting.entity';

 interface UniversidadUser {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  sucursal?: {
    nombre: string;
  };
  empleado?: {
    email: string;
    departamento?: {
      nombre: string;
    };
  };
}

 interface APIResponse {
  data: UniversidadUser[];
  meta: {
    count: number;
  };
}

export class RegisterCompletionData {
  userId: number;
  courseId: number;
  score: number;
  survey?: Record<string, number>;
}

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Course) private courseRepository: Repository<Course>,
    @InjectRepository(CourseCompletion)
    private completionRepository: Repository<CourseCompletion>,
    @InjectRepository(CourseEnrollment)
    private enrollmentRepository: Repository<CourseEnrollment>,
    @InjectRepository(CourseProgress)
    private courseProgressRepository: Repository<CourseProgress>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Setting) private settingRepository: Repository<Setting>,
    private jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  private get externalApiUrl(): string {
    const url = this.configService.get<string>('EXTERNAL_API_URL') || 'https://bridge.ppollo.org/v1/usuarios/';
    return url.replace(/['"]/g, '').trim().replace(/\/$/, '');
  }

  private get masterToken(): string {
    const token = this.configService.get<string>('MASTER_TOKEN') || '';
    return token.replace(/['"]/g, '').trim();
  }

private isValidDate(dateStr: any): boolean {
  if (!dateStr || String(dateStr).includes('NaN') || dateStr === 'undefined') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}


 async resetEnrollment(userId: number, courseId: number) {
  // 1. Buscar la inscripción
  const enrollment = await this.enrollmentRepository.findOne({
    where: { userId, courseId: Number(courseId) }
  });

  if (!enrollment) {
    throw new NotFoundException('No se encontró la inscripción para este usuario.');
  }

  // 2. Resetear valores de la inscripción
  enrollment.status = 'activo';
  enrollment.intentos = 0;
  await this.enrollmentRepository.save(enrollment);

  // 3. (Opcional pero recomendado) Eliminar registro de finalización anterior
  // para que deje de aparecer en la lista de completados
  await this.completionRepository.delete({ userId, courseId: Number(courseId) });

  return { message: 'Curso reseteado exitosamente', status: 'activo' };
}
async saveProgress(data: { userId: number; courseId: number; watchedVideos: any[]; readPDFs: any[] }) {
  const { userId, courseId, watchedVideos, readPDFs } = data;

  try {
    // 1. Buscamos el progreso usando los nombres de tu entidad
    let progress = await this.courseProgressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) {
      // 2. Si no existe, creamos el registro usando tus nombres de columna:
      // viewedVideos y viewedPdfs
      progress = this.courseProgressRepository.create({
        userId,
        courseId,
        viewedVideos: watchedVideos, // Mapeamos lo que viene del front a tu DB
        viewedPdfs: readPDFs,       // Mapeamos lo que viene del front a tu DB
        completed: false,
      });
    } else {
      // 3. Si existe, actualizamos usando los nombres de tu entidad
      progress.viewedVideos = watchedVideos;
      progress.viewedPdfs = readPDFs;
      progress.updatedAt = new Date();
    }

    return await this.courseProgressRepository.save(progress);
  } catch (error) {
    if (this.logger) {
      this.logger.error(`Error al guardar progreso: ${error.message}`);
    }
    throw new BadRequestException('No se pudo guardar el progreso del curso');
  }
}

  async findUserByUsername(username: string): Promise<User | null> {
  return await this.userRepository.findOne({
    where: { username: username } // Cambiado de 'usuario' a 'username'
  });
}

async registerAttendanceViaQR(qrToken: string, usernameInput: string) {
  try {
    const usernameClean = usernameInput.toUpperCase().trim();
    const tokenClean = qrToken.trim();

    this.logger.log(`Procesando asistencia - Token: ${tokenClean}, Usuario: ${usernameClean}`);

    // 1. BUSCAR EL CURSO (Por QR o por ID)
    const course = await this.courseRepository.findOne({
      where: [
        { qrToken: tokenClean },
        { id: isNaN(Number(tokenClean)) ? -1 : Number(tokenClean) }
      ]
    });

    if (!course) {
      this.logger.error(`Token o ID no encontrado: ${tokenClean}`);
      throw new NotFoundException('Código QR no válido o curso no encontrado.');
    }

    // 2. BUSCAR EN API EXTERNA (BRIDGE)
    const externalApiUrl = 'https://bridge.ppollo.org/v1/usuarios/';
    let userDataFromApi: UniversidadUser | null = null;

    try {
      const response = await axios.get<APIResponse>(externalApiUrl, {
        params: { q: usernameClean },
        headers: { Authorization: `Bearer ${this.masterToken}` },
        timeout: 5000
      });

      if (response.data && response.data.data) {
        userDataFromApi = response.data.data.find(
          u => u.usuario.toUpperCase().trim() === usernameClean
        ) || null;
      }
    } catch (error) {
      this.logger.warn(`Bridge no disponible para ${usernameClean}: ${error.message}`);
    }

    // 3. BUSCAR LOCALMENTE
    let localUser = await this.userRepository.findOne({
      where: { username: usernameClean }
    });

    if (!userDataFromApi && !localUser) {
      throw new NotFoundException(`El usuario "${usernameClean}" no está registrado en el sistema.`);
    }

    // 4. SINCRONIZAR USUARIO
    if (userDataFromApi) {
      if (!localUser) {
        localUser = this.userRepository.create({
          id: userDataFromApi.id,
          username: usernameClean,
          name: `${userDataFromApi.nombre} ${userDataFromApi.apellido}`.trim(),
          email: userDataFromApi.empleado?.email || `${usernameClean.toLowerCase()}@puropollo.com.mx`,
          password: 'external_auth_pp',
          role: 'user',
          sucursal: userDataFromApi.sucursal?.nombre || 'N/A',
          departamento: userDataFromApi.empleado?.departamento?.nombre || 'GENERAL'
        });
      } else {
        localUser.name = `${userDataFromApi.nombre} ${userDataFromApi.apellido}`.trim();
        localUser.sucursal = userDataFromApi.sucursal?.nombre || localUser.sucursal;
      }
      await this.userRepository.save(localUser);
    }

    if (!localUser) throw new NotFoundException('Usuario no válido.');

    // 5. REGISTRAR ASISTENCIA / AUTO-INSCRIPCIÓN
    let enrollment = await this.enrollmentRepository.findOne({
      where: { userId: localUser.id, courseId: course.id }
    });

    if (!enrollment) {
      // Si no existe, creamos la inscripción de cero
      enrollment = this.enrollmentRepository.create({
        userId: localUser.id,
        courseId: course.id,
        userName: localUser.name,
        userUsername: localUser.username,
        status: 'activo', // O 'en_progreso' según tu lógica
        intentos: 0,
        asistenciaMarcada: true,
        // Eliminé userName y userUsername porque suelen causar error si no están en la entidad Enrollment
      });
    } else {
      enrollment.asistenciaMarcada = true;
      enrollment.userName = localUser.name;
      enrollment.userUsername = localUser.username;
      if (enrollment.status === 'inactivo') enrollment.status = 'activo';
    }

    await this.enrollmentRepository.save(enrollment);

    // 6. GENERAR TOKEN PARA QUE EL FRONT LO RECONOZCA
    const accessToken = this.jwtService.sign({
      username: localUser.username,
      sub: localUser.id
    });

    return {
      success: true,
      message: `¡Asistencia confirmada para ${course.nombre}!`,
      courseId: course.id,
      accessToken,
      user: {
        id: localUser.id,
        username: localUser.username,
        name: localUser.name,
        role: localUser.role
      }
    };

  } catch (error) {
    this.logger.error(`Error en registerAttendanceViaQR: ${error.message}`);
    // Si es un error de Nest (404, 400), lo relanzamos
    if (error.status) throw error;
    // Si es un error inesperado, mandamos 400 con el mensaje
    throw new BadRequestException(error.message || 'Error interno al procesar asistencia');
  }
}

   async getStatusOptions() {
  return [
    { id: 'TODOS', nombre: 'TODOS LOS ESTADOS' },
    { id: 'activo', nombre: 'ACTIVOS' },
    { id: 'inactivo', nombre: 'INACTIVOS' }
  ];
}

  async findAllCategories() {
  try {
    // Buscamos valores únicos de la columna 'categoria'
    const categories = await this.courseRepository
      .createQueryBuilder('course')
      .select('DISTINCT(course.categoria)', 'categoria')
      .where('course.categoria IS NOT NULL AND course.categoria != :empty', { empty: '' })
      .getRawMany();

    const catList = new Set(['TODAS']);
    categories.forEach(c => {
      if (c.categoria) catList.add(c.categoria.toUpperCase().trim());
    });

    return Array.from(catList).sort().map(cat => ({
      id: cat,
      nombre: cat
    }));
  } catch (e) {
    this.logger.error('Error en findAllCategories:', e.message);
    return [{ id: 'TODAS', nombre: 'TODAS' }];
  }
}


  // --- MÉTODOS DE FILTRADO PARA ASIGNACIÓN ---

  async findUsersByFilters(filters: {
  sucursalId?: any;
  grupoId?: any;
  puesto?: string;
  query?: string;
}) {
  try {
    const query = String(filters.query || '').trim();
    const sucursalId = filters.sucursalId !== undefined ? String(filters.sucursalId) : '';
    const grupoId = filters.grupoId !== undefined ? String(filters.grupoId) : '';
    const puesto = String(filters.puesto || '').toUpperCase();

    // AJUSTE: take=100 es el máximo permitido por la API
    const url = `${this.externalApiUrl}/usuarios?q=${encodeURIComponent(query)}&take=100`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.masterToken}` },
      timeout: 15000,
    });

    const apiUsers = response.data?.data || [];

    return apiUsers
      .filter((u: any) => {
        const matchSucursal = !sucursalId || ['0', 'undefined', 'null', '', 'TODAS', 'TODAS LAS SUCURSALES'].includes(sucursalId) || String(u.sucursalId) === sucursalId;
        const matchGrupo = !grupoId ||
                   ['0', 'undefined', 'null', '', 'TODOS', 'TODOS LOS GRUPOS'].includes(grupoId) ||
                   String(u.tipoUsuario?.tipo).toUpperCase() === String(grupoId).toUpperCase();
        const puestoUsuario = (u.empleado?.perfilSalario?.perfil || '').toUpperCase();
        const matchPuesto = !puesto || ['TODOS', 'TODOS LOS PUESTOS', ''].includes(puesto) || puestoUsuario === puesto;
        return matchSucursal && matchGrupo && matchPuesto;
      })
      .map((u: any) => ({
        id: u.id,
        name: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        username: u.usuario,
        sucursalNombre: u.sucursal?.nombre || 'SIN SUCURSAL',
        puesto: u.empleado?.perfilSalario?.perfil || 'SIN PUESTO',
        departamento: u.empleado?.departamento?.nombre || 'SIN DEPARTAMENTO'
      }));
  } catch (error) {
    this.logger.error('Error en findUsersByFilters:', error.response?.data || error.message);
    return [];
  }
}

// 2. CORRECCIÓN PARA GRUPOS (Cambio de 300 a 100)


async findAllGroups() {
  try {
    // Usamos el endpoint de usuarios que sí funciona
    const response = await axios.get(`${this.externalApiUrl}/usuarios?take=100`, {
      headers: { Authorization: `Bearer ${this.masterToken}` }
    });

    // Usamos un Set para que no haya tipos repetidos
    const tiposSet = new Set(['TODOS LOS GRUPOS']);

    const users = response.data?.data || [];

    users.forEach((u: any) => {
      // Extraemos el tipo desde u.tipoUsuario.tipo
      const tipo = u.tipoUsuario?.tipo;
      if (tipo) {
        tiposSet.add(tipo.toUpperCase().trim());
      }
    });

    // Convertimos el Set a la estructura que espera tu select del frontend
    return Array.from(tiposSet).sort().map(t => ({
      id: t === 'TODOS LOS GRUPOS' ? 0 : t, // ID 0 para el default, el texto para los filtros
      nombre: t
    }));

  } catch (e) {
    this.logger.error('Error en findAllGroups (TipoUsuario):', e.message);
    return [{ id: 0, nombre: 'TODOS LOS GRUPOS' }];
  }
}


// 3. CORRECCIÓN PARA PUESTOS (Cambio de 300 a 100)
async findAllPositions() {
  try {
    const response = await axios.get(`${this.externalApiUrl}/usuarios?take=100`, {
      headers: { Authorization: `Bearer ${this.masterToken}` }
    });

    const puestosSet = new Set(['TODOS']);
    (response.data?.data || []).forEach((u: any) => {
      const p = u.empleado?.perfilSalario?.perfil;
      if (p) puestosSet.add(p.toUpperCase().trim());
    });

    return Array.from(puestosSet).sort().map(p => ({ id: p, nombre: p }));
  } catch (e) {
    return [{ id: 'TODOS', nombre: 'TODOS' }];
  }
}



  // --- MÉTODOS DE CURSOS ---

async findAll(filters?: { estado?: string; categoria?: string }): Promise<any[]> {
  try {
    const where: any = {};
    if (filters?.estado && !['TODOS', ''].includes(filters.estado.toUpperCase())) {
      where.estado = filters.estado.toLowerCase();
    }
    if (filters?.categoria && !['TODAS', ''].includes(filters.categoria.toUpperCase())) {
      where.categoria = filters.categoria;
    }

    const courses = await this.courseRepository.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      // Seleccionamos explícitamente las columnas para evitar errores de metadatos
      select: [
        'id', 'nombre', 'codigo', 'descripcion', 'creditos', 'semestre', 
        'fechaLimite', 'modalidad', 'tipo', 'duracion', 'categoria', 
        'profesor', 'estado', 'qrToken', 'questions', 'pdfs', 'videos', 
        'newencuestaconfig', 'examen' // <--- Asegúrate que esté aquí en minúsculas
      ],
      relations: ['estudiantesInscritos'],
      order: { id: 'ASC' }
    });

    return courses.map(course => ({
      id: course.id,
      nombre: course.nombre,
      codigo: course.codigo,
      descripcion: course.descripcion,
      creditos: course.creditos || 0,
      semestre: course.semestre || '',
      fechaLimite: course.fechaLimite,
      modalidad: course.modalidad,
      tipo: course.tipo,
      duracion: course.duracion,
      categoria: course.categoria,
      profesor: course.profesor,
      estado: course.estado,
      qrToken: course.qrToken,
      questions: course.questions || course.examen || [],
      pdfs: course.pdfs || [],
      videos: course.videos || [],
      estudiantes: course.estudiantesInscritos?.length || 0,
      status: course.estado || 'activo',
      instructor: course.profesor || '',
      category: course.categoria || '',
      newencuestaconfig: course.newencuestaconfig || [] // Mapeo de la encuesta
    }));
  } catch (error) {
    this.logger.error(`Error en findAll: ${error.message}`);
    return [];
  }
}

   private cleanDate(dateStr: any): Date | null {
  if (!dateStr || dateStr === '' || dateStr === 'undefined' || dateStr === 'null') {
    return null;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// --- GENERACIÓN DE CERTIFICADO (AJUSTADA PARA TIPO) ---
  async generateCertificate(userId: number, courseId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    const completion = await this.completionRepository.findOne({ where: { userId, courseId } });

    if (!user || !course || !completion) {
      throw new NotFoundException('Datos insuficientes para generar el certificado');
    }

    try {
      const templatePath = path.join(process.cwd(), 'uploads', 'templates', 'certificate-template.pdf');
      if (!fs.existsSync(templatePath)) {
        throw new NotFoundException('Plantilla de certificado no encontrada');
      }

      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);

      const fontPath = path.join(process.cwd(), 'uploads', 'fonts', 'Montserrat-Bold.ttf');
      let customFont;
      if (fs.existsSync(fontPath)) {
        const fontBytes = fs.readFileSync(fontPath);
        customFont = await pdfDoc.embedFont(fontBytes);
      } else {
        customFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      }

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Nombre del Usuario
      const fullName = (user.name || 'Usuario').toUpperCase();
      const nameFontSize = 35;
      const nameWidth = customFont.widthOfTextAtSize(fullName, nameFontSize);
      firstPage.drawText(fullName, {
        x: (width - nameWidth) / 2,
        y: height / 2 + 35,
        size: nameFontSize,
        font: customFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Nombre del Curso
      const courseName = course.nombre.toUpperCase();
      const courseFontSize = 20;
      const courseWidth = customFont.widthOfTextAtSize(courseName, courseFontSize);
      firstPage.drawText(courseName, {
        x: (width - courseWidth) / 2,
        y: height / 2 - 45,
        size: courseFontSize,
        font: customFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      // MODIFICACIÓN: Texto de Modalidad basado en el campo TIPO
      const textTipo = course.tipo === 'in-person' ? 'MODALIDAD: PRESENCIAL' : 'MODALIDAD: VIRTUAL';
      const tipoFontSize = 10;
      const tipoWidth = customFont.widthOfTextAtSize(textTipo, tipoFontSize);
      firstPage.drawText(textTipo, {
        x: (width - tipoWidth) / 2,
        y: height / 2 - 75,
        size: tipoFontSize,
        font: customFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      const dateStr = `Fecha de finalización: ${new Date(completion.completedAt).toLocaleDateString()}`;
      const dateWidth = customFont.widthOfTextAtSize(dateStr, 12);
      firstPage.drawText(dateStr, {
        x: (width - dateWidth) / 2,
        y: 80,
        size: 12,
        font: customFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      const pdfBytes = await pdfDoc.save();
      const fileName = `certificate_${userId}_${courseId}_${Date.now()}.pdf`;
      const outputPath = path.join(process.cwd(), 'uploads', 'certificates', fileName);

      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      fs.writeFileSync(outputPath, pdfBytes);
      return `/uploads/certificates/${fileName}`;
    } catch (error) {
      this.logger.error('Error generando certificado:', error);
      throw error;
    }
  }

 async create(courseData: any) {
    try {
      const categoriaFinal = courseData.categoria === 'otra'
        ? courseData.nuevaCategoria
        : courseData.categoria;

      // Extraemos la encuesta explícitamente
      const encuesta = courseData.newencuestaconfig || courseData.newEncuestaConfig || [];

      const newCourse = this.courseRepository.create({
        ...courseData,
        codigo: courseData.codigo || `CUR-${Date.now()}`, 
        status: courseData.estado || 'activo',           
        estado: courseData.estado || 'activo',
        categoria: categoriaFinal,
        newencuestaconfig: encuesta, // Asignación directa y explícita
        qrToken: uuidv4(),
        estudiantes: 0,
      });

      const savedCourse = await this.courseRepository.save(newCourse);
      return savedCourse;
    } catch (error) {
      this.logger.error(`Error al crear curso: ${error.message}`);
      throw new BadRequestException('Error al crear el curso. Verifique los datos.');
    }
  }

async update(id: number, data: any) {
  try {
    const course = await this.courseRepository.findOne({ where: { id: Number(id) } });
    if (!course) throw new NotFoundException(`Curso ${id} no encontrado`);

    // 1. Capturamos la encuesta. Si no viene nada, mantenemos lo que había.
    // Usamos minúsculas siempre para coincidir con la base de datos (newencuestaconfig)
    const encuestaActualizada = data.newencuestaconfig || data.newEncuestaConfig || course.newencuestaconfig;

    // 2. Limpieza estricta de propiedades que TypeORM rechaza
    const { 
      id: _, 
      createdAt, 
      newEncuestaConfig, 
      newencuestaconfig: __, 
      estudiantesInscritos, 
      ...cleanData 
    } = data;

    // 3. Fusionamos datos generales (nombre, descripción, etc.)
    this.courseRepository.merge(course, cleanData);

    // 4. Asignación manual de la configuración de la encuesta
    // Aquí es donde se guardan los tipos 'rating' (pollos) y 'multiple' (cerradas)
    course.newencuestaconfig = encuestaActualizada;

    const savedCourse = await this.courseRepository.save(course);
    return savedCourse;
  } catch (error) {
    this.logger.error(`Error al actualizar curso ${id}: ${error.message}`);
    throw new BadRequestException(`No se pudo actualizar: ${error.message}`);
  }
}
 async findCoursesByUser(userId: number): Promise<any[]> {
    try {
      const enrollments = await this.enrollmentRepository.find({
        where: { userId: Number(userId) },
      });

      if (enrollments.length === 0) return [];
      const courseIds = enrollments.map((e) => e.courseId);

      const courses = await this.courseRepository.find({
        where: { id: In(courseIds) },
        relations: ['estudiantesInscritos'],
      });

      const completions = await this.completionRepository.find({
        where: { userId: userId, courseId: In(courseIds) }
      });
      const completedIds = completions.map(c => Number(c.courseId));

      return courses.map((course: any) => ({
        ...course,
        estudiantes: course.estudiantesInscritos?.length || 0,
        isCompleted: completedIds.includes(Number(course.id)),
        // Aplicamos la misma limpieza de propiedades aquí
        status: course.estado || 'activo',
        estado: course.estado || 'activo',
        instructor: course.profesor || '',
        profesor: course.profesor || '',
        category: course.categoria || '',
        categoria: course.categoria || ''
      }));
    } catch (error) {
      this.logger.error(`Error en findCoursesByUser: ${error.message}`);
      return [];
    }
  }

async remove(id: string) {
  const numericId = Number(id);
  try {
    // Borramos inscripciones, progreso y completitud antes que el curso
    await this.enrollmentRepository.delete({ courseId: numericId });
    await this.completionRepository.delete({ courseId: numericId });
    await this.courseProgressRepository.delete({ courseId: numericId });

    return await this.courseRepository.delete(numericId);
  } catch (error) {
    throw new Error(`Error en cascada: ${error.message}`);
  }
}
  async findUsersBySucursal(sucursalId: string, query: string = '') {
    try {
      const url = `${this.externalApiUrl}/usuarios?q=${encodeURIComponent(query.trim())}&take=50`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.masterToken}` },
        timeout: 15000,
      });
      const apiUsers = response.data?.data || [];
      return apiUsers
        .filter((u: any) => !sucursalId || ['0', 'undefined', 'null', ''].includes(String(sucursalId)) || String(u.sucursalId) === String(sucursalId))
        .map((u: any) => ({
          id: u.id,
          name: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
          username: u.usuario,
          sucursalNombre: u.sucursal?.nombre || 'SIN SUCURSAL',
          puesto: u.empleado?.perfilSalario?.perfil || 'COLABORADOR',
        }));
    } catch (error) { return []; }
  }

  async assignUsersToCourse(courseId: string, userIds: number[]) {
    await this.enrollmentRepository.delete({ courseId: Number(courseId) });

    if (userIds.length > 0) {
      const usersData = await this.findSpecificUsersFromApi(userIds);
      const newEnrollments = userIds.map((uId) => {
        const apiUser = usersData.find((u) => Number(u.id) === Number(uId));
        return this.enrollmentRepository.create({
          courseId: Number(courseId),
          userId: uId,
          userName: apiUser ? `${apiUser.nombre} ${apiUser.apellido}`.trim() : `Usuario ${uId}`,
          userUsername: apiUser ? apiUser.usuario : `u${uId}`,
        });
      });
      await this.enrollmentRepository.save(newEnrollments);
    }
    return { success: true, message: 'Usuarios asignados correctamente' };
  }

  private async findSpecificUsersFromApi(ids: number[]): Promise<UniversidadUser[]> {
    try {
      const allRecovered: UniversidadUser[] = [];
      for (let page = 1; page <= 5; page++) {
        const response = await axios.get<APIResponse>(`${this.externalApiUrl}/usuarios?take=100&page=${page}`, {
          headers: { Authorization: `Bearer ${this.masterToken}` },
        });
        const data = response.data.data || [];
        if (data.length === 0) break;
        allRecovered.push(...data.filter((u) => ids.includes(Number(u.id))));
        if (allRecovered.length >= ids.length) break;
      }
      return allRecovered;
    } catch (e) { return []; }
  }

   async registerCompletion(userId: number, courseId: number, respuestasUsuario: any, survey: any) {
    // 1. Buscar la inscripción, el curso y al USUARIO (para los puntos)
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId }
    });

    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!enrollment || !course || !user) {
      throw new NotFoundException('Inscripción, curso o usuario no encontrado');
    }

    // 2. VALIDACIÓN DE BLOQUEOS
    const ahora = new Date();
    if (course.fechaLimite && ahora > new Date(course.fechaLimite)) {
      throw new BadRequestException('El curso ha expirado.');
    }

    let progressExistente = await this.courseProgressRepository.findOne({
      where: { userId, courseId }
    });

    if (progressExistente && progressExistente.completed) {
      throw new BadRequestException('Ya has aprobado este curso.');
    }

    if (enrollment.intentos >= 2) {
      throw new BadRequestException('Has agotado tus 2 intentos permitidos.');
    }

    // 3. VALIDACIÓN DE RESPUESTAS
    const preguntasSistema = course.questions || [];
    let aciertos = 0;

    preguntasSistema.forEach((pregunta, index) => {
      const respuestaDada = respuestasUsuario[index];
      const respuestaCorrecta = pregunta.answer;
      if (respuestaDada === respuestaCorrecta) {
        aciertos++;
      }
    });

    const calificacionMinima = 70;
    const puntaje = preguntasSistema.length > 0 ? (aciertos / preguntasSistema.length) * 100 : 100;
    const aprobado = puntaje >= calificacionMinima;

    // 4. ACTUALIZAR INTENTOS
    enrollment.intentos += 1;

    if (aprobado) {
      // A. Guardar en course_completions (Esto habilita que aparezca el DIPLOMA)
      const completion = this.completionRepository.create({
        userId,
        courseId,
        score: puntaje,
        survey: {
          respuestas: survey?.respuestas || [],
          comentarioFinal: survey?.comentarioFinal || '',
          fechaRespuesta: new Date().toISOString()
        },
      });
      await this.completionRepository.save(completion);

      // B. ACTUALIZAR PUNTOS DEL USUARIO (Esto desbloquea el REGALO)
      // Usamos el campo 'creditos' del curso. Si no tiene, por defecto damos 100.
      const puntosAGanar = Number(course.creditos) || 100;
      user.puntos = (Number(user.puntos) || 0) + puntosAGanar;
      await this.userRepository.save(user);

      // C. Actualizar course_progress a completed = true
      if (progressExistente) {
        progressExistente.completed = true;
        await this.courseProgressRepository.save(progressExistente);
      } else {
        const newProgress = this.courseProgressRepository.create({
          userId,
          courseId,
          completed: true,
        });
        await this.courseProgressRepository.save(newProgress);
      }
    }

    await this.enrollmentRepository.save(enrollment);

    return {
      status: aprobado ? 'SUCCESS' : 'FAILED',
      score: puntaje,
      intentosRestantes: 2 - enrollment.intentos,
      message: aprobado ? '¡Felicidades! Has aprobado y ganado puntos.' : 'No has alcanzado el puntaje mínimo.'
    };
}

  async getProgress(userId: number, courseId: number) {
    const progress = await this.courseProgressRepository.findOne({ where: { courseId: Number(courseId), userId: Number(userId) } });
    return progress || { viewedVideos: [], viewedPdfs: [], attempts: 0 };
  }

  async getUserCompletions(userId: number): Promise<string[]> {
    const completions = await this.completionRepository.find({
      where: { userId: Number(userId) }
    });
    return completions.map((c) => String(c.courseId));
  }

  async getEnrolledStudents(courseId: string) {
    const enrollments = await this.enrollmentRepository.find({ where: { courseId: Number(courseId) } });
    return enrollments.map((e) => ({
      id: e.userId,
      name: e.userName || `USUARIO ${e.userId}`,
      username: e.userUsername || 'desconocido',
    }));
  }

  async getRealReportStats() {
    const enrollments = await this.enrollmentRepository.count();
    const completions = await this.completionRepository.find();
    const cursos = await this.courseRepository.find();
    const rangos = [
      { rango: '0-5', min: 0, max: 59, color: '#EF4444', cantidad: 0 },
      { rango: '6-7', min: 60, max: 75, color: '#F59E0B', cantidad: 0 },
      { rango: '7-8', min: 76, max: 85, color: '#10B981', cantidad: 0 },
      { rango: '8-9', min: 86, max: 95, color: '#3B82F6', cantidad: 0 },
      { rango: '9-10', min: 96, max: 100, color: '#8B5CF6', cantidad: 0 },
    ];
    completions.forEach((c) => {
      const rango = rangos.find((r) => c.score >= r.min && c.score <= r.max);
      if (rango) rango.cantidad++;
    });
    const cursosMap = new Map();
    completions.forEach((c) => {
      const cursoNombre = cursos.find((curso) => curso.id === c.courseId)?.nombre || 'Desconocido';
      if (!cursosMap.has(cursoNombre)) cursosMap.set(cursoNombre, { suma: 0, count: 0, aprobados: 0 });
      const s = cursosMap.get(cursoNombre);
      s.suma += c.score; s.count++; if (c.score >= 60) s.aprobados++;
    });
    return {
      totalInscripciones: enrollments,
      totalCalificaciones: completions.length,
      distribucion: rangos.map((r) => ({ ...r, porcentaje: completions.length > 0 ? Math.round((r.cantidad / completions.length) * 100) : 0 })),
      rendimiento: Array.from(cursosMap.entries()).map(([nombre, s]) => ({ curso: nombre, promedio: Math.round(s.suma / s.count), aprobados: s.aprobados, reprobados: s.count - s.aprobados })).slice(0, 5),
    };
  }
    async generateDiplomaPdf(userId: number, courseId: number, res: any) {
  try {
    const uId = Number(userId);
    const cId = Number(courseId);

    const course = await this.courseRepository.findOne({ where: { id: cId } });
    const completion = await this.completionRepository.findOne({ where: { userId: uId, courseId: cId } });

    if (!course || !completion) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }

    const enrollment = await this.enrollmentRepository.findOne({ where: { userId: uId, courseId: cId } });
    const user = await this.userRepository.findOne({ where: { id: uId } });
    let nombreFinal = (enrollment?.userName || user?.name || "ESTUDIANTE").toUpperCase();

    // RUTA DE ASSETS (Validación para VPS/Local)
    const assetsPath = path.join(process.cwd(), 'assets');
    const pdfPath = path.join(assetsPath, 'diploma_base.pdf');

    if (!fs.existsSync(pdfPath)) {
      this.logger.error(`No se encontró el PDF base en: ${pdfPath}`);
      return res.status(500).json({ message: "Plantilla de diploma no encontrada en el servidor." });
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    // Cargar fuentes
    const fontPala = await pdfDoc.embedFont(fs.readFileSync(path.join(assetsPath, 'pala.ttf')));
    const fontLexend = await pdfDoc.embedFont(fs.readFileSync(path.join(assetsPath, 'LexendDeca-Light.ttf')));

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // --- HELPERS DE TIPOGRAFÍA ---
    const drawWithTracking = (text: string, x: number, y: number, font: any, size: number, tracking: number, color = rgb(0, 0, 0)) => {
      const charSpacing = (tracking / 1000) * size;
      let curX = x;
      for (const char of text) {
        page.drawText(char, { x: curX, y, font, size, color });
        curX += font.widthOfTextAtSize(char, size) + charSpacing;
      }
    };

    const getWidthWithTracking = (text: string, font: any, size: number, tracking: number) => {
      const charSpacing = (tracking / 1000) * size;
      return font.widthOfTextAtSize(text, size) + ((text.length - 1) * charSpacing);
    };

    // --- 1. NOMBRE DEL ESTUDIANTE ---
    const fontSizeNombre = 27.1;
    const trackingNombre = 25;
    const nombreWidth = getWidthWithTracking(nombreFinal, fontPala, fontSizeNombre, trackingNombre);

    drawWithTracking(
      nombreFinal,
      (width - nombreWidth) / 2,
      height - 312, 
      fontPala,
      fontSizeNombre,
      trackingNombre
    );

    // --- 2. PÁRRAFO DE RECONOCIMIENTO ---
    const fontSizeBody = 12;
    const trackingBody = 25;
    const interlineado = 21.21;
    const colorDorado = rgb(0.72, 0.59, 0.20); // Tono dorado institucional más vibrante
    const colorNegro = rgb(0, 0, 0);

    const nombreCurso = course.nombre.toUpperCase();
    const palabrasDelCurso = nombreCurso.split(/\s+/).filter(p => p.length > 0);

    const textoCompleto = `EN RECONOCIMIENTO POR HABER CONCLUIDO SATISFACTORIAMENTE EL CURSO ${nombreCurso} EN LA UNIVERSIDAD PURO POLLO EN LÍNEA, REAFIRMANDO SU COMPROMISO CON EL APRENDIZAJE CONTINUO Y EL CRECIMIENTO PROFESIONAL.`;

    const marginSide = 95; // Margen optimizado para evitar cortes visuales
    const maxWidth = width - (marginSide * 2);

    const wrapText = (text: string, font: any, size: number, tracking: number, maxW: number): string[] => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testWidth = getWidthWithTracking(currentLine + " " + word, font, size, tracking);
        if (testWidth < maxW) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const lineasGeneradas = wrapText(textoCompleto, fontPala, fontSizeBody, trackingBody, maxWidth);

    lineasGeneradas.forEach((linea, i) => {
      const wordsInLine = linea.split(/\s+/);
      const textWidth = getWidthWithTracking(linea, fontPala, fontSizeBody, trackingBody);
      let currentX = (width - textWidth) / 2;
      const yPos = height - 385 - (i * interlineado);

      wordsInLine.forEach((word, wordIdx) => {
        // Limpieza de caracteres de puntuación para la comparación de color
        const cleanWord = word.replace(/[.,""'']/g, '');
        const esParteDelCurso = palabrasDelCurso.some(p => p === cleanWord);

        const colorCapa = esParteDelCurso ? colorDorado : colorNegro;

        drawWithTracking(word, currentX, yPos, fontPala, fontSizeBody, trackingBody, colorCapa);

        if (wordIdx < wordsInLine.length - 1) {
          const spaceWidth = getWidthWithTracking(" ", fontPala, fontSizeBody, trackingBody);
          currentX += getWidthWithTracking(word, fontPala, fontSizeBody, trackingBody) + spaceWidth;
        }
      });
    });

    // --- 3. FECHA ---
    const hoy = new Date();
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const fechaTexto = `MAZATLÁN, SINALOA. ${hoy.getDate().toString().padStart(2, '0')} DE ${meses[hoy.getMonth()]} DE ${hoy.getFullYear()}.`;

    const fontSizeFecha = 9;
    const trackingFecha = 100;
    const fechaWidth = getWidthWithTracking(fechaTexto, fontLexend, fontSizeFecha, trackingFecha);

    drawWithTracking(
      fechaTexto,
      (width / 2) - (fechaWidth / 2),
      65, // Ajuste de altura para quedar visible sobre el margen inferior
      fontLexend,
      fontSizeFecha,
      trackingFecha
    );
    const pdfBytes = await pdfDoc.save();

    // Seteamos headers explícitos para descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Diploma_${nombreFinal.replace(/\s+/g, '_')}.pdf"`,
      'Content-Length': pdfBytes.length,
      // Esto ayuda a que el navegador no lo cachee
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    // Enviamos el buffer y cerramos la conexión
    return res.end(Buffer.from(pdfBytes));

  } catch (error) {
    this.logger.error('Error generando PDF:', error);
    // Si res ya se cerró por headers, evitamos doble respuesta
    if (!res.headersSent) {
      return res.status(500).send('Error interno al generar el PDF');
    }
  }
}

  async generateKardex(userId: number, res: any) {
    let nombreEstudiante = `ID: ${userId}`;
    let sucursalEstudiante = "GENERAL";
    try {
      const baseUrl = this.externalApiUrl.replace(/\/$/, '');
      for (let pagina = 1; pagina <= 20; pagina++) {
        const response = await axios.get(`${baseUrl}/usuarios?page=${pagina}&q=`, { headers: { Authorization: `Bearer ${this.masterToken}` } });
        const user = response.data?.data?.find((u: any) => String(u.id) === String(userId));
        if (user) {
          nombreEstudiante = `${user.nombre || ''} ${user.apellido || ''}`.trim().toUpperCase();
          sucursalEstudiante = user.sucursal?.nombre?.toUpperCase() || 'GENERAL';
          break;
        }
        if (pagina >= (response.data?.meta?.pages || 0)) break;
      }
    } catch (e) {}

    const enrollments = await this.enrollmentRepository.find({ where: { userId: Number(userId) } });
    const completions = await this.completionRepository.find({ where: { userId: Number(userId) } });
    const allCourses = await this.courseRepository.find({ order: { id: 'ASC' } });

    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage([600, 800]);
    const { height } = page.getSize();

    page.drawText('KARDEX ACADÉMICO - UNIVERSIDAD PURO POLLO', { x: 50, y: height - 50, size: 14, font: fontBold });
    page.drawText(`ESTUDIANTE: ${nombreEstudiante}`, { x: 50, y: height - 75, size: 10, font: fontBold });
    page.drawText(`SUCURSAL: ${sucursalEstudiante}`, { x: 50, y: height - 90, size: 9, font: fontNormal });

    let yPos = height - 150;
    let totalCreditos = 0;
    for (const course of allCourses) {
      const comp = completions.find((c) => Number(c.courseId) === Number(course.id));
      const enr = enrollments.find((e) => Number(e.courseId) === Number(course.id));
      if (!enr && !comp) continue;

      const logrados = comp ? (Number(course.creditos) || 0) : 0;
      totalCreditos += logrados;
      page.drawText(course.nombre.substring(0, 50).toUpperCase(), { x: 50, y: yPos, size: 8, font: fontNormal });
      page.drawText(comp ? 'FINALIZADO' : 'EN CURSO', { x: 350, y: yPos, size: 8, font: fontNormal });
      page.drawText(logrados.toString(), { x: 530, y: yPos, size: 8, font: fontNormal });
      yPos -= 20;
    }
    page.drawText(`TOTAL CRÉDITOS: ${totalCreditos}`, { x: 320, y: yPos - 30, size: 11, font: fontBold, color: rgb(0, 0.3, 0) });

    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(await pdfDoc.save()));
  }

  async findAllBranches() {
    try {
      const response = await axios.get(`${this.externalApiUrl}/usuarios?take=100`, { headers: { Authorization: `Bearer ${this.masterToken}` } });
      const sucursalesMap = new Map([[0, { id: 0, nombre: 'TODAS LAS SUCURSALES' }]]);
      (response.data?.data || []).forEach((u: any) => {
        if (u.sucursalId && u.sucursal?.nombre) sucursalesMap.set(u.sucursalId, { id: u.sucursalId, nombre: u.sucursal.nombre.toUpperCase() });
      });
      return Array.from(sucursalesMap.values());
    } catch (e) { return [{ id: 0, nombre: 'TODAS LAS SUCURSALES' }]; }
  }

    async uploadFileToBlob(file: any) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Limpiamos el nombre del archivo para evitar problemas con espacios o caracteres especiales
    const cleanFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    fs.writeFileSync(path.join(uploadDir, cleanFileName), file.buffer);

    // Retornamos la ruta relativa que el frontend usará para construir la URL final
    return { url: `/uploads/${cleanFileName}` };
  }


  async findSettings(key: string) {
    try {
      const setting = await this.settingRepository.findOne({ where: { key } });
      // Retornamos directamente el valor (el objeto JSON con carrusel, etc)
      return setting ? setting.value : null;
    } catch (error) {
      this.logger.error(`Error al obtener configuración ${key}:`, error);
      return null;
    }
  }

   async updateSettings(data: { key: string; value: any }) {
    try {
      const { key, value } = data;
      let setting = await this.settingRepository.findOne({ where: { key } });

      if (setting) {
        setting.value = value;
      } else {
        setting = this.settingRepository.create({ key, value });
      }

      await this.settingRepository.save(setting);
      return { success: true, message: 'Configuración guardada correctamente' };
    } catch (error) {
      this.logger.error(`Error al guardar configuración:`, error);
      throw error;
    }
  }

  async getCompletedCourseIds(userId: string): Promise<string[]> {
  const completions = await this.completionRepository.find({
    where: { userId: Number(userId) }
  });
  // Retorna un array de strings: ["1", "5", "12"]
  return completions.map(c => String(c.courseId));
}
async getEnrollmentsByUser(userId: string) {
  try {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId: Number(userId) }
    });

    // Buscamos el progreso para saber si realmente está completado (booleano)
    const progress = await this.courseProgressRepository.find({
      where: { userId: Number(userId) }
    });

    return enrollments.map(e => {
      const raw = e as any;
      const marcada = raw.asistenciaMarcada ?? raw.asistenciamarcada ?? false;

      // Buscamos si existe un registro de progreso completado para este curso
      const courseProgress = progress.find(p => String(p.courseId) === String(e.courseId));

      return {
        courseId: String(e.courseId),
        status: e.status, // Aquí suele venir 'activo'
        intentos: e.intentos || 0,
        asistenciaMarcada: !!marcada,
        completed: courseProgress?.completed ?? false // <-- ESTO ES LO QUE NECESITA EL FRONT
      };
    });
  } catch (error) {
    this.logger.error(`Error en getEnrollmentsByUser:`, error);
    return [];
  }
}

   async getEnrollmentStatus(userId: number, courseId: number) {
  try {
    // 1. Buscamos la inscripción específica
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId: Number(userId), courseId: Number(courseId) }
    });

    // 2. Buscamos el progreso para verificar si está completado
    const progress = await this.courseProgressRepository.findOne({
      where: { userId: Number(userId), courseId: Number(courseId) }
    });

    // 3. Si no existe inscripción, retornamos un estado inicial
    if (!enrollment) {
      return {
        status: 'no_enrolled',
        intentos: 0,
        asistenciaMarcada: false,
        completed: false
      };
    }

    // 4. Mapeo de seguridad para nombres de columnas en DB (asistenciaMarcada vs asistenciamarcada)
    const raw = enrollment as any;
    const marcada = raw.asistenciaMarcada ?? raw.asistenciamarcada ?? false;

    return {
      status: enrollment.status,
      intentos: enrollment.intentos || 0,
      asistenciaMarcada: !!marcada,
      completed: progress?.completed ?? false
    };
  } catch (error) {
    this.logger.error(`Error en getEnrollmentStatus: ${error.message}`);
    return {
      status: 'error',
      intentos: 0,
      asistenciaMarcada: false,
      completed: false
    };
  }
}

 async getCompletedCourseDetails(userId: string) {
  try {
    const completions = await this.completionRepository.find({
      where: { userId: Number(userId) }
    });

    if (completions.length === 0) return [];

    const courseIds = completions.map(c => c.courseId);

    // CAMBIO: Añadimos 'creditos' a la selección
    const courses = await this.courseRepository.find({
      where: { id: In(courseIds) },
      select: ['id', 'nombre', 'creditos'] 
    });

    return courses;
  } catch (error) {
    this.logger.error(`Error al obtener detalles de cursos completados:`, error);
    return [];
  }
 }
}
