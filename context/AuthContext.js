import React, { createContext, useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import database from "@react-native-firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user session when app starts
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log("✅ User logged in:", user.uid);
        await fetchUserRole(user.uid);  
        setIsLoggedIn(true);
      } else {
        console.log("❌ User logged out");
        setIsLoggedIn(false);
        setRole("user");
        await AsyncStorage.removeItem("userData");
      }
      setLoading(false);
    });
  
    return () => unsubscribe(); // Cleanup listener
  }, []);
  
  // ✅ Fetch User Role from Firebase
  const fetchUserRole = async (userId) => {
    try {
      const snapshot = await database().ref(`users/accounts/${userId}`).once("value");
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setRole(userData.role || "user");

        // ✅ Store in AsyncStorage for Faster Reload
        await AsyncStorage.setItem("userData", JSON.stringify({ role: userData.role }));
      } else {
        console.warn("⚠️ No role found for user");
        setRole("user");
      }
    } catch (error) {
      console.error("❌ Error fetching user role:", error);
      setRole("user");
    }
  };

  // ✅ Login function
  const login = async (email, password) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      console.log("✅ Firebase Login Successful:", user.uid);
      await fetchUserRole(user.uid); // ✅ Fetch role after login
  
      setIsLoggedIn(true);
    } catch (error) {
      console.error("❌ Login Error:", error.message);
    }
  };
  

  // ✅ Logout function
  const logout = async (navigation) => {
    try {
      await auth().signOut();
      await AsyncStorage.removeItem("userData");
      setIsLoggedIn(false);
      setRole(null);
  
      console.log("✅ Logged out successfully");
  
      // ✅ Ensure Navigation to Login Screen
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }], // Make sure "Auth" is your login stack screen
        });
      }
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  };
  

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
