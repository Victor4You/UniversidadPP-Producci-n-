import { Injectable, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import md5 from 'md5';
import { LoginDto } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private get EXTERNAL_API_URL() {
    const url = process.env.EXTERNAL_API_URL || 'https://bridge.ppollo.org/v1';
    return url.replace(/['"]/g, '').trim();
  }

  private readonly MASTER_TOKEN =
    'Tyau4EiHXpVdp4bxwt4byTBg62h6fh3MHBlIc0gTeH5g13sXfBwOeX0vFcQXQcFV';

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<Record<string, any>> {
    this.logger.log(`Intentando login para: ${loginDto.username}`);

    if (!loginDto || !loginDto.password || !loginDto.username) {
      throw new UnauthorizedException('Datos de login incompletos');
    }

    try {
      const url = `${this.EXTERNAL_API_URL}/usuarios/usuario/${loginDto.username}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.MASTER_TOKEN.trim()}` },
        timeout: 2000,
      });

      const externalUser = response.data;
      if (!externalUser || md5(loginDto.password) !== externalUser.password) {
        throw new UnauthorizedException('Usuario o contraseña incorrectos');
      }

      return await this.sincronizarYGenerarToken(externalUser);

    } catch (error: any) {
      if (error.status === 401) throw error;
      this.logger.error(`⚠️ FALLO API EXTERNA: ${error.message}`);

      // Búsqueda explícita por username para evitar error 22P02 de Postgres
      const user = await this.userRepo.findOne({
        where: { username: String(loginDto.username) },
      });

      if (user) {
        const inputPassword = loginDto.password || '';
        if (user.password !== md5(inputPassword)) {
          throw new UnauthorizedException('Contraseña local incorrecta');
        }

        return {
          id: user.id,
          usuario: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          token: this.jwtService.sign({
            sub: user.id,
            username: user.username,
            role: user.role,
          }),
        };
      }
      throw new UnauthorizedException('Usuario no encontrado o API caída');
    }
  }
    
    private async sincronizarYGenerarToken(externalUser: any) {
  const isNtj = externalUser.id === 9957 || externalUser.usuario === 'NTJ';
  const isMarco = externalUser.id === 1833 || externalUser.usuario === 'MARCO';
  const isGerencia = externalUser.empleado?.departamento?.nombre === 'GERENCIA';
  const role = isNtj || isMarco || isGerencia ? 'admin' : 'estudiante';

  // 1. BUSCAR SI YA EXISTE LOCALMENTE PARA TRAER EL AVATAR
  const localUser = await this.userRepo.findOne({
    where: { id: Number(externalUser.id) },
  });

  const userData = {
    id: externalUser.id,
    usuario: externalUser.usuario,
    name: `${externalUser.nombre} ${externalUser.apellido}`.trim(),
    email: externalUser.empleado?.email || '',
    avatar: localUser?.avatar || externalUser.avatar || null, // AÑADIR ESTA LÍNEA
    role: role,
    token: this.jwtService.sign({
      sub: externalUser.id,
      username: externalUser.usuario,
      role: role,
    }),
  };

  try {
    if (!localUser) {
      await this.userRepo.save(
        this.userRepo.create({
          id: Number(externalUser.id),
          username: externalUser.usuario,
          password: externalUser.password,
          name: userData.name,
          email: userData.email,
          role: role,
          avatar: externalUser.avatar || null, // Guardar el inicial si existe
        }),
      );
    } else if (localUser.role !== role) {
      localUser.role = role;
      await this.userRepo.save(localUser);
    }
  } catch (e) {
    this.logger.error(`Error sincronizando: ${e.message}`);
  }

  return userData;
}


    async updateUserAvatar(id: string, avatar: string) {
    const userId = Number(id);
    this.logger.log(`Actualizando avatar para usuario ID: ${userId}`);

    try {
      // 1. Buscamos al usuario en la base de datos local
      const user = await this.userRepo.findOne({
        where: { id: userId }
      });

      if (!user) {
        this.logger.error(`Usuario con ID ${userId} no encontrado para actualizar avatar.`);
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // 2. Actualizamos el campo avatar
      user.avatar = avatar;

      // 3. Guardamos los cambios
      const updatedUser = await this.userRepo.save(user);
      this.logger.log(`Avatar actualizado con éxito para: ${user.username}`);
      
      return {
        message: 'Avatar actualizado correctamente',
        avatar: updatedUser.avatar
      };
    } catch (error) {
      this.logger.error(`Error en updateUserAvatar: ${error.message}`);
      throw error;
    }
  }


async getUserProfile(username: string) {
  const cleanUsername = String(username || '').trim();
  this.logger.log(`Solicitando perfil para: ${cleanUsername}`);

  try {
    const url = `${this.EXTERNAL_API_URL}/usuarios/usuario/${cleanUsername}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.MASTER_TOKEN.trim()}` },
      timeout: 2500,
    });

    if (response.data) {
      // 1. Buscamos SIEMPRE al usuario local para obtener su avatar y rol actualizados
      const localUser = await this.userRepo.findOne({
        where: { username: cleanUsername }
      });

      return {
        ...response.data,
        // PRIORIDAD: Si tenemos avatar local, usamos ese. Si no, el de la API.
        avatar: localUser?.avatar || response.data.avatar || null,
        role: localUser?.role || 'estudiante',
        usuario: response.data.usuario || cleanUsername,
      };
    }
  } catch (error: any) {
    this.logger.warn(`API Externa no respondió para ${cleanUsername}. Usando DB Local.`);
  }

  // FALLBACK SEGURO A DB LOCAL
  try {
    const user = await this.userRepo.findOne({
      where: { username: cleanUsername }
    });

    if (!user) {
      this.logger.error(`Usuario ${cleanUsername} no encontrado.`);
      return null;
    }

    return {
      id: user.id,
      nombre: user.name || 'Usuario',
      apellido: '',
      usuario: user.username,
      email: user.email || '',
      role: user.role || 'estudiante',
      // CORRECCIÓN: Usar el avatar de la DB local, no devolver null
      avatar: user.avatar || null, 
      empleado: {
        email: user.email || '',
        sucursalActiva: { nombre: (user as any).sucursal || 'Sede Central' },
        departamento: { nombre: (user as any).departamento || 'General' },
        celular: (user as any).telefono || 'No disponible',
        fechaIngreso: (user as any).fechaIngreso || null,
        perfilSalario: { perfil: (user.role || 'Colaborador').toUpperCase() }
      }
    };
  } catch (dbError) {
    this.logger.error(`Error de columnas en DB Local: ${dbError.message}`);
    return null;
  }
}

  async getInstructors() {
    try {
      const admins = await this.userRepo.find({ where: { role: 'admin' } });
      const detailedAdmins = await Promise.all(
        admins.map(async (admin) => {
          try {
            const extUrl = `${this.EXTERNAL_API_URL}/usuarios/usuario/${admin.username}`;
            const response = await axios.get(extUrl, {
              headers: { Authorization: `Bearer ${this.MASTER_TOKEN.trim()}` },
              timeout: 1500,
            });

            const extData = response.data;
            return {
              id: admin.id,
              nombre: `${extData.nombre} ${extData.apellido}`.trim() || admin.name,
              especialidad: extData.empleado?.perfilSalario?.perfil || 'ADMINISTRATIVO',
              email: extData.empleado?.email || admin.email,
              telefono: extData.empleado?.celular || 'No disponible',
              experiencia: extData.empleado?.sucursalActiva?.nombre || 'Sede Central',
              cursos: 0,
              avatar: extData.avatar || null,
              estado: 'activo' as const,
              username: admin.username,
            };
          } catch (e) {
            return {
              id: admin.id,
              nombre: admin.name,
              especialidad: 'INSTRUCTOR',
              email: admin.email,
              telefono: 'No disponible',
              experiencia: 'Colaborador',
              cursos: 0,
              avatar: null,
              estado: 'activo' as const,
              username: admin.username,
            };
          }
        }),
      );
      return detailedAdmins;
    } catch (error) {
      this.logger.error(`Error obteniendo instructores: ${error.message}`);
      return [];
    }
  }

  async getUsersBySucursal(id: string) { return []; }
  async searchUsersPartial(t: string) { return this.userRepo.find(); }
  register(d: any) { return this.userRepo.save(this.userRepo.create(d)); }
}
