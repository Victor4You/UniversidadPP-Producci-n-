// src/hooks/useStudentCourses.ts
// src/hooks/useStudentCourses.ts
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useAuth } from "@/contexts/AuthContext/useAuth";

export const useStudentCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || !user.id || user.id === undefined) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/courses/enrollments/user/${user.id}`);
        setCourses(response.data);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.error("Error en useStudentCourses:", err);
        }
        setError(err.message || "Error al cargar cursos");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user?.id]);

  return { courses, loading, error };
};
