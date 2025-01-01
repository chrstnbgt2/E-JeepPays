import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const user = auth().currentUser;

        if (user) {
          const cachedRole = await AsyncStorage.getItem('userRole');
          if (cachedRole) {
            setRole(cachedRole);
            setIsLoggedIn(true);
          } else {
            const roleSnapshot = await database()
              .ref(`/users/passengers/${user.uid}/role`)
              .once('value');
            const userRole = roleSnapshot.val();

            if (userRole) {
              await AsyncStorage.setItem('userRole', userRole);
              setRole(userRole);
              setIsLoggedIn(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const setAuthState = (authState) => {
    setIsLoggedIn(authState.isLoggedIn);
    setRole(authState.role);
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await auth().signOut();
      await AsyncStorage.removeItem('userRole');
      setIsLoggedIn(false);
      setRole(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, loading, logOut, setAuthState }}>
    {children}
  </AuthContext.Provider>
  );
};
