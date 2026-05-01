import { LoginCredentials, User } from '@/lib/types/auth.types';
import api from '@/lib/api/axios';

class AuthService {
  /**
   * Realiza el login contra la API real
   */
  async login(credentials: any): Promise<{token: string, username: string} | null> {
    try {
      // Forzamos el nombre de los campos para que coincidan con el Backend
      const loginPayload = {
        username: credentials.username || credentials.email, 
        password: credentials.password
      };

      console.log("Enviando loginPayload:", loginPayload); // Para depurar en consola

      const response = await api.post('/auth/login', loginPayload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error de autenticación';
      throw new Error(message);
    }
  }
  /**
   * Obtiene la información completa del perfil
   */
  async getUserProfile(username: string): Promise<User | null> {
    try {
      const response = await api.get(`/users/user/${username}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }

  validateToken(token: string): boolean {
    return !!token && token.split('.').length === 3;
  }
}

export const authService = new AuthService();
