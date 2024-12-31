import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { StyleSheet, TouchableOpacity, Image } from 'react-native';

// Import screens
import LoginRegister from './pages/LoginRegister';
import LoginScreen from './pages/Login';
import RegisterScreen from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/JeepTracker';
import MyQR from './pages/QrCode';
import History from './pages/Transactions';
import ProfileScreen from './pages/Profile';
import CashInScreen from './pages/Cashin';
import MyQRScreenShare from './pages/QrCodeShare';
import DiscountScreen from './pages/Discount';
import BusDetail from './pages/BusDetail';
import RegisterScreen2 from './pages/RegisterCont';
import ProfileScreenDriver from './pages/DriverProfile';
import Conductors from './pages/DriverConductors';
import CreateConductor from './pages/AddConductor';
import UpdateConductor from './pages/UpdateConductor';
import HomeScreenDriver from './pages/DashboardDriver';
import HomeScreenConductor from './pages/DashbooardConductor';
import QRCodeScannerScreen from './pages/ScanQR';
import ProfileScreenConductor from './pages/ProfileScreenConductor';
import MyQRScreenShareConductor from './pages/ConductorShareQr';
import GeneratedQRPage from './pages/GenerateQr';
// Navigators
const AuthStack = createStackNavigator();
const UserTabs = createBottomTabNavigator();
const DriverTabs = createBottomTabNavigator();
const ConductorTabs = createBottomTabNavigator();
const RootStack = createStackNavigator();

/** Authentication Navigator */
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="LoginRegister" component={LoginRegister} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="Next" component={RegisterScreen2} />
  </AuthStack.Navigator>
);

/** User Tab Navigator */
const UserNavigator = () => (
  <UserTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        if (route.name === 'Tracker') iconName = 'location';
        if (route.name === 'Profile') iconName = 'person';
        if (route.name === 'MyQR') iconName = 'qr-code';
        if (route.name === 'History') iconName = 'time';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#A5BE7D',
      tabBarInactiveTintColor: '#FFFFFF',
    })}
  >
    <UserTabs.Screen name="Home" component={Dashboard} />
    <UserTabs.Screen name="Tracker" component={Tracker} />
    <UserTabs.Screen name="MyQR" component={MyQR} />
    <UserTabs.Screen name="History" component={History} />
    <UserTabs.Screen name="Profile" component={ProfileScreen} />
  </UserTabs.Navigator>
);

/** Driver Tab Navigator */
const DriverNavigator = () => (
  <DriverTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'DashboardDriver') iconName = 'home';
        if (route.name === 'Seat') iconName = 'car';
        if (route.name === 'Profile') iconName = 'person';
        if (route.name === 'History') iconName = 'time';
        // Skip rendering the middle tab's icon (handled by custom tabBarButton)
        if (route.name === 'MiddleTab') return null;

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#A5BE7D',
      tabBarInactiveTintColor: '#FFFFFF',
    })}
  >
    <DriverTabs.Screen name="DashboardDriver" component={HomeScreenDriver} options={{ tabBarLabel: 'home' }} />
    <DriverTabs.Screen name="Seat" component={BusDetail} options={{ tabBarLabel: 'Seat' }} />

    {/* Custom Middle Tab with Image */}
    <DriverTabs.Screen
      name="MiddleTab"
      component={Dashboard}
      options={{
        tabBarButton: () => (
          <TouchableOpacity style={styles.middleTab}>
            <Image
              source={require('./assets/images/qrlogo.png')} // Replace with your custom image
              style={styles.middleImage}
            />
          </TouchableOpacity>
        ),
      }}
    />

    <DriverTabs.Screen name="History" component={History} options={{ tabBarLabel: 'History' }} />
    <DriverTabs.Screen name="Profile" component={ProfileScreenDriver} options={{ tabBarLabel: 'Profile' }} />
  </DriverTabs.Navigator>
);

/** Conductor Tab Navigator */
const ConductorNavigator = () => (
  <ConductorTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'DashboardConductor') iconName = 'home';
        if (route.name === 'Tracker') iconName = 'location';
        if (route.name === 'ScanQR') iconName = 'scan-circle-outline';
        if (route.name === 'History') iconName = 'time';
        if (route.name === 'Profile') iconName = 'person';

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#A5BE7D',
      tabBarInactiveTintColor: '#FFFFFF',
    })}
  >
    <ConductorTabs.Screen name="DashboardConductor" component={HomeScreenConductor} options={{ tabBarLabel: 'home' }} />
    <ConductorTabs.Screen name="Tracker" component={Tracker} />
    <ConductorTabs.Screen name="ScanQR" component={QRCodeScannerScreen} />
    <ConductorTabs.Screen name="History" component={History} options={{ tabBarLabel: 'History' }} />
    <ConductorTabs.Screen name="Profile" component={ProfileScreenConductor} options={{ tabBarLabel: 'Profile' }} />

  </ConductorTabs.Navigator>
);
 
/** Root Navigator */
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      // Simulated login status and role fetch
      const loggedIn = true; // Change to true for testing logged-in flow
      const userRole = 'driver'; // Change to 'user', 'driver', or 'conductor' for testing
      setIsLoggedIn(loggedIn);
      setRole(userRole);
    };

    checkLoginStatus();
  }, []);

  if (!isLoggedIn) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {role === 'user' ? (
          <RootStack.Screen name="User" component={UserNavigator} />
        ) : role === 'driver' ? (
          <RootStack.Screen name="Driver" component={DriverNavigator} />
        ) : role === 'conductor' ? (
          <RootStack.Screen name="Conductor" component={ConductorNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
        {/* Additional Screens Accessible from All Roles */}
        <RootStack.Screen name="Discount" component={DiscountScreen} />
        <RootStack.Screen name="CashIn" component={CashInScreen} />
        <RootStack.Screen name="Share" component={MyQRScreenShareConductor} />
        <RootStack.Screen name="BusDetail" component={BusDetail} />
        <RootStack.Screen name="ConductorList" component={Conductors} />
        <RootStack.Screen name="AddConductor" component={CreateConductor} />
        <RootStack.Screen name="UpdateConductor" component={UpdateConductor} />
        <RootStack.Screen name="GenerateQR" component={GeneratedQRPage} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#466B66',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: 70,
    paddingBottom: 10,
    paddingTop: 5,
  },
  middleTab: {
    position: 'absolute',
    top: -2,  
    left:10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
    backgroundColor: '#FFF', 
    borderRadius: 30,  
    elevation: 5,  
  },
  middleImage: {
    height: 60,
    width: 60,
    resizeMode: 'contain',
  },
});

export default App;
