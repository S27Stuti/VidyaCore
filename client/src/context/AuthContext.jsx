import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('vidyacore_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vidyacore_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vidyacore_token');
    localStorage.removeItem('vidyacore_user');
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('vidyacore_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session expired or invalid', err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password, expectedRole) => {
    const res = await api.post('/auth/login', { email, password, expectedRole });
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('vidyacore_token', jwtToken);
    localStorage.setItem('vidyacore_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('vidyacore_token', jwtToken);
    localStorage.setItem('vidyacore_user', JSON.stringify(userData));
    return userData;
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    const updatedUser = res.data.user;
    setUser(updatedUser);
    localStorage.setItem('vidyacore_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  // One-click quick login for testing
  const quickLoginAs = async (roleType) => {
    const credentials = {
      principal: { email: 'principal@vidyacore.edu', password: 'password123' },
      teacher: { email: 'teacher.verma@vidyacore.edu', password: 'password123' },
      student_aarav: { email: 'student.aarav@vidyacore.edu', password: 'password123' },
      student_rohan: { email: 'student.rohan@vidyacore.edu', password: 'password123' }
    };

    const cred = credentials[roleType];
    if (cred) {
      return await login(cred.email, cred.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        role: user?.role,
        login,
        register,
        updateProfile,
        logout,
        quickLoginAs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

