import { Controller, Get, Param, NotFoundException, Patch, Body } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  // 1. Endpoint para actualizar Avatar
  @Patch(':id')
  async updateAvatar(
    @Param('id') id: string,
    @Body('avatar') avatar: string
  ) {
    try {
      return await this.authService.updateUserAvatar(id, avatar);
    } catch (error) {
      console.error("Error al actualizar avatar en controlador:", error);
      throw error;
    }
  }

  // 2. Puente hacia la API de PuroPollo Bridge
  @Get('empleados/todos')
  async getAllEmpleados() {
    try {
      let allData: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const url = `${process.env.EXTERNAL_API_URL}/usuarios/?q=&page=${page}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MASTER_TOKEN}`
          }
        });

        if (!response.ok) break;

        const result = await response.json();
        const currentData = result.data || [];

        if (currentData.length === 0) {
          hasMore = false;
        } else {
          allData = [...allData, ...currentData];
          page++;
        }
        if (page > 100) hasMore = false;
      }
      return { data: allData };
    } catch (error) {
      console.error("Error en el puente de empleados:", error);
      throw new Error("Error al conectar con el servidor de empleados");
    }
  }

  // 3. Obtener todos los usuarios locales
  @Get()
  async getAllUsers() {
    const users = await this.authService.searchUsersPartial('');
    return users.map(user => ({
      ...user,
      tipoUsuario: {
        tipo: user.role?.toUpperCase() || 'SIN ROL'
      }
    }));
  }

  // 4. Perfil de usuario por username
  @Get('user/:username')
  async getUserProfile(
    @Param('username') username: string,
  ): Promise<Record<string, any>> {
    const user = await this.authService.getUserProfile(username);
    if (!user) {
      throw new NotFoundException(`El usuario "${username}" no fue encontrado`);
    }
    return user;
  }

  // 5. Obtener instructores
  @Get('instructors')
  async getInstructors(): Promise<any[]> {
    return await this.authService.getInstructors();
  }

  // 6. Búsqueda de usuarios
  @Get('search/:term')
  async searchUsers(@Param('term') term: string): Promise<any[]> {
    return await this.authService.searchUsersPartial(term);
  }
} // <--- ESTA llave cierra la clase. No debe haber llaves de cierre antes.
