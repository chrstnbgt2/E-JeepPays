import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import database from '@react-native-firebase/database';
import Geolocation from '@react-native-community/geolocation';
import auth from '@react-native-firebase/auth';

import { MAPBOX_ACCESS_TOKEN } from '@env';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];


const QRCodeScannerScreen = () => {
  const navigation = useNavigation();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTime, setLastScannedTime] = useState(0);
  const scanInterval = 2000;
  const [locationError, setLocationError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
    const [passengerType, setPassengerType] = useState(null);
 const [qrValue, setQrValue] = useState('');
 const [jeepneyStatus, setJeepneyStatus] = useState(null);
 const [userStatus, setUserStatus] = useState('active'); // Tracks if the user is active or inactive 

 useFocusEffect(
  useCallback(() => {
    const resetState = () => {
      setUserStatus(null); // ✅ Reset status
      setIsScanning(false); // ✅ Stop scanning
    };

    resetState(); // Ensure state resets before checking user status

    const checkUserStatus = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const conductorUid = currentUser.uid;
        const conductorRef = database().ref(`/users/accounts/${conductorUid}`);

        // 🚨 Listen for real-time updates
        conductorRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            const conductorData = snapshot.val();
            setUserStatus(conductorData.status); // ✅ Reinitialize status
          }
        });
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();

    return () => {
      // Cleanup Firebase listener when the screen is unmounted
      database().ref(`/users/accounts/${auth().currentUser?.uid}`).off();
    };
  }, [])
);

 const showVehicleStatusPopup = () => {
  Alert.alert(
    'Vehicle Status',
    'Out of Service - Cannot Proceed Transaction',
    [{ text: 'OK', onPress: () => console.log('User acknowledged') }]
  );
};

 useEffect(() => {
  const checkJeepneyStatus = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('No user logged in.');
        return;
      }

      const conductorUid = currentUser.uid;
      const conductorRef = database().ref(`/users/accounts/${conductorUid}`);
      const conductorSnapshot = await conductorRef.once('value');

      if (!conductorSnapshot.exists()) {
        console.warn('Conductor account not found.');
        return;
      }

      const conductorData = conductorSnapshot.val();
      const driverUid = conductorData.creatorUid;
      if (!driverUid) {
        console.warn('No linked driver found.');
        return;
      }

      const driverRef = database().ref(`/users/accounts/${driverUid}`);
      const driverSnapshot = await driverRef.once('value');

      if (!driverSnapshot.exists()) {
        console.warn('Driver account not found.');
        return;
      }

      const driverData = driverSnapshot.val();
      const jeepneyId = driverData.jeep_assigned;
      if (!jeepneyId) {
        console.warn('No jeepney assigned.');
        return;
      }

      const jeepneyRef = database().ref(`/jeepneys/${jeepneyId}`);
      const jeepneySnapshot = await jeepneyRef.once('value');

      if (!jeepneySnapshot.exists()) {
        console.warn('Jeepney not found.');
        return;
      }

      const jeepneyData = jeepneySnapshot.val();
      setJeepneyStatus(jeepneyData.status);

      // ✅ Automatically show pop-up if the status is NOT "in-service"
      if (jeepneyData.status !== 'in-service') {
        showVehicleStatusPopup();
      }
    } catch (error) {
      console.error('Error checking jeepney status:', error);
    }
  };

  checkJeepneyStatus();
}, []);


  const sanitizeQRValue = (value) => {
    return value.replace(/[<>]/g, '').trim();
  };

  const fetchLocationFromFirebase = async (userId) => {
    try {
      const snapshot = await database().ref(`/users/locations/${userId}`).once('value');
      if (snapshot.exists()) {
        const location = snapshot.val();
        return { latitude: location.latitude, longitude: location.longitude };
      } else {
        throw new Error('No location data available in Firebase.');
      }
    } catch (error) {
      console.error('Error fetching location from Firebase:', error);
      return null;
    }
  };

  const getLocation = async (userId) => {
    try {
      const location = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocationError(false); // Clear error state on success
            resolve({ latitude, longitude });
          },
          (error) => {
            console.warn('Geolocation failed, falling back to Firebase:', error);
            setLocationError(true); // Set error state on failure
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
        );
      });
      return location;
    } catch (geolocationError) {
      const fallbackLocation = await fetchLocationFromFirebase(userId);
      if (fallbackLocation) {
        setLocationError(false); // Clear error state if Firebase fallback succeeds
        return fallbackLocation;
      } else {
        setLocationError(true); // Set error state if both fail
        throw new Error('Failed to retrieve location from both Geolocation and Firebase.');
      }
    }
  };



const handleGenerate = async () => {
    if (!passengerType) {
      Alert.alert('Error', 'Please select a passenger type.');
      return;
    }
  
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to generate a QR code.');
        return;
      }
  
      const userLoggedUid = currentUser.uid;
      const dailyCountRef = database().ref(`usernameCount/${userLoggedUid}`);
      const currentDate = new Date().toISOString().split('T')[0];
  
      let newUsernameCount = await dailyCountRef.transaction((data) => {
        if (data && data.date === currentDate) {
          return { date: currentDate, count: data.count + 1 }; // Increment safely
        } else {
          return { date: currentDate, count: 1 }; // Reset if new day
        }
      }).then((result) => result.committed ? result.snapshot.val().count : 1);
  
      // Ensure we fetched the correct count
      if (!newUsernameCount) {
        Alert.alert('Error', 'Failed to fetch username count.');
        return;
      }
  
      // Create new temp QR reference
      const tempRef = database().ref(`temporary/${userLoggedUid}`).push();
      const generatedUid = tempRef.key;  
  
      const tempData = {
        createdAt: new Date().toISOString(),
        status: "enabled",
        type: passengerType,
        username: `${newUsernameCount}`, // Ensures unique username per day
      };
  
      await tempRef.set(tempData); // Store QR code data
  
      console.log(`Temporary QR Code generated: ${generatedUid}`);
      console.log(`Generated Username: ${newUsernameCount}`);
  
      setQrValue(generatedUid); 
      setModalVisible(false); 
  
      navigation.navigate('GenerateQR', {
        passengerType,
        userId: userLoggedUid,  
        qrValue: generatedUid,  
      });
      
    } catch (error) {
      console.error('Error generating temporary QR:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    }
  };


  //MAIN FUNCTION
  const saveTripToFirebase = async (scannedUid) => {
    try {
      setIsScanning(true);
  
      let isTemporaryQR = false;
      let creatorUid = scannedUid;
      let tempData = null;
  
      // Flag that indicates we will handle partial or zero-balance as a cash flow
      let cashPayment = false;
  
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Conductor is not logged in.");
        setIsScanning(false);
        return;
      }
  
      const conductorUid = currentUser.uid;
      const conductorRef = database().ref(`/users/accounts/${conductorUid}`);
      const conductorSnapshot = await conductorRef.once("value");
      if (!conductorSnapshot.exists()) {
        Alert.alert("Error", "Conductor account not found.");
        setIsScanning(false);
        return;
      }
  
      const conductorData = conductorSnapshot.val();
      const conductorName = `${conductorData.firstName || ""} ${conductorData.lastName || ""}`.trim();
  
      // The driver who "owns" this conductor
      const driverUid = conductorData.creatorUid;
      if (!driverUid) {
        Alert.alert("Error", "No linked driver found for this conductor.");
        setIsScanning(false);
        return;
      }
  
      const driverRef = database().ref(`/users/accounts/${driverUid}`);
      const driverSnapshot = await driverRef.once("value");
      if (!driverSnapshot.exists()) {
        Alert.alert("Error", "Driver account not found.");
        setIsScanning(false);
        return;
      }
      const driverData = driverSnapshot.val();
  
      // Jeepney assigned to the driver
      const jeepneyId = driverData.jeep_assigned;
      if (!jeepneyId) {
        Alert.alert("Error", "No jeepney assigned to this driver.");
        setIsScanning(false);
        return;
      }
  
      const jeepneyRef = database().ref(`/jeepneys/${jeepneyId}`);
      const jeepneySnapshot = await jeepneyRef.once("value");
      if (!jeepneySnapshot.exists()) {
        Alert.alert("Error", "Jeepney not found.");
        setIsScanning(false);
        return;
      }
  
      const jeepneyData = jeepneySnapshot.val();
      const maxCapacity = jeepneyData.capacity || 25;
      let currentCapacity = jeepneyData.currentCapacity ?? maxCapacity;
  
      // Ensure jeepney is "in-service"
      if (jeepneyData.status !== "in-service") {
        Alert.alert("Jeep Status", "Out of Service. Cannot complete transaction.");
        setIsScanning(false);
        return;
      }
  
      // Check if scanned QR is a "temporary" code
      const tempRef = database().ref(`/temporary`);
      const tempSnapshot = await tempRef.once("value");
      tempSnapshot.forEach((child) => {
        const generatedUidData = child.val();
        const generatedUidKeys = Object.keys(generatedUidData);
        if (generatedUidKeys.includes(scannedUid)) {
          isTemporaryQR = true;
          creatorUid = child.key; // The user who generated this temporary QR
          tempData = generatedUidData[scannedUid];
        }
      });
  
      // If it's a temporary code but not valid or already disabled
      if (isTemporaryQR && (!tempData || tempData.status !== "enabled")) {
        Alert.alert("Error", "This temporary QR code is invalid or already disabled.");
        setIsScanning(false);
        return;
      }
  
      // Fetch passenger data (the user who owns the QR)
      const userRef = database().ref(`/users/accounts/${creatorUid}`);
      const userSnapshot = await userRef.once("value");
      if (!userSnapshot.exists()) {
        Alert.alert("Error", "No user found for this QR code.");
        setIsScanning(false);
        return;
      }
      const userData = userSnapshot.val();
  
      // Determine fare type
      let fareType = isTemporaryQR
        ? tempData?.type?.toLowerCase() || "regular"
        : userData.acc_type?.toLowerCase() || "regular";
  
      // Load fare rates
      const fareRef = database().ref(`/fares/${fareType}`);
      const fareSnapshot = await fareRef.once("value");
      if (!fareSnapshot.exists()) {
        Alert.alert("Error", `Fare type "${fareType}" not found.`);
        setIsScanning(false);
        return;
      }
  
      const fareData = fareSnapshot.val();
      const baseFareDistanceMeters = 4000;
      const baseFare = fareData.firstKm;
      const additionalRatePerMeter = fareData.succeedingKm / 1000;
  
      // The "tripListRef" is where we store the trip data
      const tripListRef = database().ref(`/trips/temporary/${creatorUid}/${scannedUid}`);
      const tripSnapshot = await tripListRef.once("value");
  
      // ------------------------------------------------------
      //  IF TRIP IS IN-PROGRESS, WE COMPLETE THE TRIP (2ND SCAN)
      // ------------------------------------------------------
      if (tripSnapshot.exists() && tripSnapshot.val().status === "in-progress") {
        const tripData = tripSnapshot.val();
  
        // Only allow the same conductor to finish the trip
        if (tripData.conductorUid !== conductorUid) {
          Alert.alert("Error", "You are not authorized to complete this trip.");
          setIsScanning(false);
          return;
        }
  
        // 1) Get location to compute route
        const location = await getLocation(currentUser.uid);
        if (!location) throw new Error("Failed to retrieve location.");
        const { latitude, longitude } = location;
  
        // 2) Calculate distance via Mapbox
        const { latitude: startLat, longitude: startLong } = tripData.start_loc;
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLong},${startLat};${longitude},${latitude}?access_token=${MAPBOX_ACCESS_TOKEN}`;
        const response = await fetch(directionsUrl);
        const routeData = await response.json();
  
        if (!response.ok || !routeData.routes || routeData.routes.length === 0) {
          Alert.alert("Error", "Failed to get route from Mapbox.");
          setIsScanning(false);
          return;
        }
  
        // 3) Compute payment
        const distanceMeters = routeData.routes[0].distance;
        let payment = baseFare;
        if (distanceMeters > baseFareDistanceMeters) {
          const extraMeters = distanceMeters - baseFareDistanceMeters;
          payment += extraMeters * additionalRatePerMeter;
        }
        payment = parseFloat(payment.toFixed(2));
  
        // 4) Deduct from passenger’s wallet or handle partial/cash
        let deductedAmount = 0;
        let userMessage = `Trip Payment Successful with an amount of ₱${payment}`;
        let conductorMessage = `Trip Payment Received with an amount of ₱${payment}`;
  
        // (a) If user’s balance is enough for full fare
        if (userData.wallet_balance >= payment) {
          await userRef.update({ wallet_balance: userData.wallet_balance - payment });
          await conductorRef.update({
            wallet_balance: (conductorData.wallet_balance || 0) + payment,
          });
          deductedAmount = payment;
        }
        // (b) If user’s balance is partially sufficient
        else if (userData.wallet_balance > 0) {
          const userBalance = userData.wallet_balance;
          const remainingFare = payment - userBalance;
  
          // Deduct entire user balance
          await userRef.update({ wallet_balance: 0 });
          await conductorRef.update({
            wallet_balance: (conductorData.wallet_balance || 0) + userBalance,
          });
          deductedAmount = userBalance;
  
          userMessage = `Trip Payment Successful. ₱${userBalance.toFixed(
            2
          )} from wallet; remaining ₱${remainingFare.toFixed(2)} paid in cash.`;
          conductorMessage = `Trip Payment Received. Passenger's wallet: ₱${userBalance.toFixed(
            2
          )}; remaining ₱${remainingFare.toFixed(2)} in cash.`;
  
          Alert.alert(
            "Insufficient Balance",
            `Passenger paid ₱${userBalance.toFixed(2)} from wallet. Remaining ₱${remainingFare.toFixed(
              2
            )} will be cash.`
          );
          cashPayment = true;
        }
        // (c) If user’s balance is zero => full cash
        else {
          deductedAmount = 0;
          cashPayment = true;
          userMessage = `Trip Payment Successful. Cash payment of ₱${payment} received.`;
          conductorMessage = `Trip Payment Received. Passenger paid cash for ₱${payment}.`;
        }
  
        // 5) Notify passenger, conductor, driver
        await database().ref(`/notification_user/${creatorUid}`).push({
          creatorUid,
          amount: payment,
          status: "unread",
          createdAt: new Date().toISOString(),
          type: "trip",
          message: userMessage,
        });
        await database().ref(`/notification_user/${conductorUid}`).push({
          conductorUid,
          amount: payment,
          status: "unread",
          createdAt: new Date().toISOString(),
          type: "trip",
          message: conductorMessage,
        });
        await database().ref(`/notification_user/${driverUid}`).push({
          driverUid,
          amount: payment,
          status: "unread",
          conductorName,
          createdAt: new Date().toISOString(),
          type: "trip",
          message: conductorMessage,
        });
  
        // 6) Store transaction in passenger’s account
        await database().ref(`/users/accounts/${creatorUid}/transactions`).push({
          type: "trip",
          description: cashPayment
            ? "Trip cash payment processed"
            : "Trip payment deducted",
          conductorUid,
          conductorName,
          amount: payment,
          distance: parseFloat((distanceMeters / 1000).toFixed(2)),
          createdAt: new Date().toISOString(),
        });
  
     // 7) Store transaction in conductor’s account (only if not cash)
     if (cashPayment) {
      await database().ref(`/users/accounts/${conductorUid}/transactions`).push({
        type: "trip",
        description: "Trip payment received",
        conductorUid,
        conductorName: "You",
        amount: payment,
        distance: parseFloat((distanceMeters / 1000).toFixed(2)),
        createdAt: new Date().toISOString(),
      });
    }
        // 7.5) Store transaction in conductor’s account (only if not cash)
        if (cashPayment) {
          await database().ref(`/users/accounts/${driverUid}/transactions`).push({
            type: "trip",
            description: "Trip payment received",
            conductorUid,
            conductorName: conductorName,
            amount: payment,
            distance: parseFloat((distanceMeters / 1000).toFixed(2)),
            createdAt: new Date().toISOString(),
          });
        }

        // 7) Store transaction in conductor’s account (only if not cash)
        if (!cashPayment) {
          await database().ref(`/users/accounts/${conductorUid}/transactions`).push({
            type: "trip",
            description: "Trip payment received",
            conductorUid,
            conductorName: "You",
            amount: payment,
            distance: parseFloat((distanceMeters / 1000).toFixed(2)),
            createdAt: new Date().toISOString(),
          });
        }
            // 7.5) Store transaction in conductor’s account (only if not cash)
            if (!cashPayment) {
              await database().ref(`/users/accounts/${driverUid}/transactions`).push({
                type: "trip",
                description: "Trip payment received",
                conductorUid,
                conductorName: conductorName,
                amount: payment,
                distance: parseFloat((distanceMeters / 1000).toFixed(2)),
                createdAt: new Date().toISOString(),
              });
            }
  
        // 8) Mark trip as completed
        await tripListRef.update({
          stop_loc: { latitude, longitude },
          distance: parseFloat((distanceMeters / 1000).toFixed(2)),
          payment,
          status: "completed",
        });
  
        // 9) Free up a seat
        currentCapacity = Math.min(maxCapacity, currentCapacity + 1);
        await jeepneyRef.update({ currentCapacity });
  
        // If it was a temporary QR, disable it
        if (isTemporaryQR) {
          const qrRef = database().ref(`/temporary/${creatorUid}/${scannedUid}`);
          await qrRef.update({ status: "disabled" });
        }
      
        try {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const dailyStatsRef = database().ref(`/jeepneys/${jeepneyId}/dailyStats/${today}`);
        
          await dailyStatsRef.transaction((currentStats) => {
            // If no stats exist, initialize them.
            if (currentStats === null) {
              return {
                totalIncome: payment,
                totalPassengers: 1,
                cashPayment: cashPayment ? payment : 0,
                cashlessPayment: cashPayment ? 0 : payment,
              };
            }
        
            // Use default values if fields are missing.
            const prevIncome = Number(currentStats.totalIncome) || 0;
            const prevPassengers = Number(currentStats.totalPassengers) || 0;
            const prevCashPayment = Number(currentStats.cashPayment) || 0;
            const prevCashlessPayment = Number(currentStats.cashlessPayment) || 0;
        
            const newTotalIncome = prevIncome + payment;
            const newTotalPassengers = prevPassengers + 1;
        
            if (cashPayment) {
              const newCashPayment = prevCashPayment + payment;
              return {
                ...currentStats,
                totalIncome: parseFloat(newTotalIncome.toFixed(2)),
                totalPassengers: newTotalPassengers,
                cashPayment: parseFloat(newCashPayment.toFixed(2)),
              };
            } else {
              const newCashlessPayment = prevCashlessPayment + payment;
              return {
                ...currentStats,
                totalIncome: parseFloat(newTotalIncome.toFixed(2)),
                totalPassengers: newTotalPassengers,
                cashlessPayment: parseFloat(newCashlessPayment.toFixed(2)),
              };
            }
          });
        } catch (error) {
          console.error("Error updating daily stats:", error);
          Alert.alert("Error", "There was an issue updating daily stats.");
        }
        
  
        Alert.alert(
          "Trip Completed",
          `Trip completed! Fare: ₱${payment.toFixed(2)}. Seats Available: ${currentCapacity}`
        );
        setTimeout(() => setIsScanning(false), 500);
      }
      // ------------------------------------------------------
      //   ELSE: NO IN-PROGRESS TRIP => START A NEW TRIP (1ST SCAN)
      // ------------------------------------------------------
      else {
        // Check if jeepney is full
        if (currentCapacity <= 0) {
          Alert.alert("Error", "The jeepney is full.");
          setIsScanning(false);
          return;
        }
  
        // Get location for trip start
        const location = await getLocation(currentUser.uid);
        if (!location) throw new Error("Failed to retrieve location.");
        const { latitude, longitude } = location;
  
        // 1) If user has zero balance, prompt to proceed with cash
        if (userData.wallet_balance === 0) {
          const confirmCashPayment = () =>
            new Promise((resolve) => {
              Alert.alert(
                "Cash Payment",
                "Passenger has zero balance. Proceed with cash payment?",
                [
                  { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
                  { text: "Proceed", onPress: () => resolve(true) },
                ],
                { cancelable: false }
              );
            });
  
          const proceed = await confirmCashPayment();
          if (!proceed) {
            setIsScanning(false);
            return;
          }
          cashPayment = true;
        }
  
        // 2) If user’s balance is > 0 but < baseFare, show info
        if (userData.wallet_balance > 0 && userData.wallet_balance < baseFare) {
          await new Promise((resolve) => {
            Alert.alert(
              "Insufficient Passenger Balance",
              `Passenger balance is only ₱${userData.wallet_balance}. The remaining fare will be paid in cash.`,
              [{ text: "OK", onPress: () => resolve() }],
              { cancelable: false }
            );
          });
          cashPayment = true;
        }
  
        // 3) Start the trip
        await tripListRef.set({
          start_loc: { latitude, longitude },
          stop_loc: null,
          distance: 0,
          payment: 0,
          status: "in-progress",
          type: fareType,
          qrId: scannedUid,
          timestamp: Date.now(),
          // Store which conductor started this trip
          conductorUid,
        });
  
        // 4) Decrement a seat
        currentCapacity -= 1;
        await jeepneyRef.update({ currentCapacity });
  
        Alert.alert(
          "Trip Started",
          `New trip has been started! Remaining Seats: ${currentCapacity}`
        );
        setTimeout(() => setIsScanning(false), 500);
      }
    } catch (error) {
      console.error("Error saving trip to Firebase:", error);
      Alert.alert("Error", "Failed to save trip data.");
      setIsScanning(false);
    }
  };
  
   
  
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const now = Date.now();
      if (!isScanning && codes.length > 0 && now - lastScannedTime > scanInterval) {
        setIsScanning(true);
        const scannedUid = sanitizeQRValue(codes[0].value);
        console.log(`Scanned User UID: ${scannedUid}`);
        setLastScannedTime(now);
        saveTripToFirebase(scannedUid);

        setTimeout(() => {
          setIsScanning(false);
        }, scanInterval);
      } else {
        console.log('Scan ignored due to interval or already scanning');
      }
    },
  });
  


  const uploadQrCode = async () => {
    if (isScanning) return;
    setIsScanning(true); // Keep scanning state active until alert is dismissed
  
    try {
      const result = await launchImageLibrary({ mediaType: 'photo' });
  
      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize / (1024 * 1024);
        const fileExtension = fileUri.split('.').pop().toLowerCase();
  
        if (fileSize > MAX_FILE_SIZE_MB) {
          Alert.alert('Error', `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please upload a smaller image.`, [
            { text: 'OK', onPress: () => setIsScanning(false) }
          ]);
          return;
        }
  
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
          Alert.alert('Error', 'Unsupported file format. Please upload a JPG or PNG image.', [
            { text: 'OK', onPress: () => setIsScanning(false) }
          ]);
          return;
        }
  
        RNQRGenerator.detect({ uri: fileUri })
          .then((response) => {
            const { values } = response;
            if (values && values.length > 0) {
              const sanitizedQR = sanitizeQRValue(values[0]);
              console.log('Decoded QR Code Content:', sanitizedQR);
              saveTripToFirebase(sanitizedQR);
            } else {
              Alert.alert('Error', 'No QR code detected in the image.', [
                { text: 'OK', onPress: () => setIsScanning(false) }
              ]);
            }
          })
          .catch((error) => {
            console.error('Error decoding QR code:', error);
            Alert.alert('Error', 'Failed to decode QR code.', [
              { text: 'OK', onPress: () => setIsScanning(false) }
            ]);
          });
      } else {
        Alert.alert('Error', 'No image selected.', [
          { text: 'OK', onPress: () => setIsScanning(false) }
        ]);
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      Alert.alert('Error', 'Failed to upload or read QR code image.', [
        { text: 'OK', onPress: () => setIsScanning(false) }
      ]);
    }
  };
  

  useEffect(() => {
    const checkPermission = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    };
    checkPermission();
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>Camera permission is required to use this feature.</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>No camera device found.</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Code Scanner</Text>
      </View>

      {/* GPS Location Error */}
      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to retrieve GPS location. Please ensure GPS is enabled.
          </Text>
        </View>
      )}

      {/* Scanner Title */}
      <Text style={styles.scannerTitle}>Scan passenger QR code</Text>

      {/* QR Code Scanner */}
      <View style={styles.qrContainer}>
        <View style={styles.qrBox}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={userStatus !== 'Inactive' && !isScanning} // ✅ Disable camera if user is inactive
            codeScanner={userStatus === 'Inactive' ? null : codeScanner} // ✅ Disable scanner if inactive
          />
          {/* Loading Overlay */}
          {isScanning && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.loadingText}>Processing... Please wait</Text>
            </View>
          )}
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button1, userStatus === 'Inactive' && { opacity: 0.5 }]} // ✅ Disable button if inactive
          onPress={() => userStatus !== 'Inactive' && setModalVisible(true)}
          disabled={userStatus === 'Inactive'}>
          <Text style={styles.buttonText}>Create QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button2, (isScanning || userStatus === 'Inactive') && { opacity: 0.6 }]}
          onPress={uploadQrCode}
          disabled={isScanning || userStatus === 'Inactive'}>
          <Text style={styles.buttonText}>
            {isScanning ? 'Processing...' : 'Upload QR Code'}
          </Text>
        </TouchableOpacity>
      </View>
    <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button3,(isScanning || userStatus === 'Inactive') && { opacity: 0.6 }]}
          onPress={() => navigation.navigate('AllQR')}>
          <Text style={styles.buttonText}>View ALL QR Generated</Text>
        </TouchableOpacity>
      </View>
      {/* Modal for Passenger Type Selection */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type of Passenger</Text>
            <TouchableOpacity
              style={passengerType === 'Regular' ? styles.selectedOption : styles.option}
              onPress={() => setPassengerType('Regular')}>
              <Text style={styles.optionText}>REGULAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={passengerType === 'Discount' ? styles.selectedOption : styles.option}
              onPress={() => setPassengerType('Discount')}>
              <Text style={styles.optionText}>DISCOUNTED</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🚨 Undismissable Modal when User is Inactive 🚨 */}
      <Modal visible={userStatus === 'Inactive'} transparent={true} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.inactiveModal}>
      {/* 🚨 Warning Icon */}
      <Ionicons name="alert-circle" size={50} color="#E74C3C" style={styles.warningIcon} />

      <Text style={styles.inactiveTitle}>Access Restricted</Text>
      <Text style={styles.inactiveMessage}>
        Your account is inactive. Please contact your driver.
      </Text>

      {/* Contact Support Button */}
      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => {
          navigation.navigate('Home'); // Navigates to Home
        }}
      >
        <Text style={styles.supportButtonText}>Return</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



    </View>
  );
  
};

 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  backButton: { marginRight: 8 },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
  },  scannerTitle: { marginTop: 20, fontSize: 16, textAlign: 'center', color: '#333', fontWeight: '500' },
  qrContainer: { alignSelf: 'center', marginTop: 50, width: 350, height: 350, borderWidth: 2, borderColor: '#7FA06F', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  qrBox: { width: '90%', height: '90%', borderWidth: 2, borderColor: '#000', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  iconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingHorizontal: 20 },
  button1: { backgroundColor: '#74A059', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  button2: { backgroundColor: '#4E764E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  button3: { backgroundColor: '#215A3E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  infoText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  errorContainer: {
    backgroundColor: '#black',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 18,
  },  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },  option: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedOption: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#D6E6CF',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  generateButton: {
    backgroundColor: '#2B393B',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dim the background
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveModal: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  warningIcon: {
    marginBottom: 10,
  },
  inactiveTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E74C3C', // Red warning color
    marginBottom: 10,
  },
  inactiveMessage: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  supportButton: {
    backgroundColor: '#E74C3C', // Red button
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRCodeScannerScreen;
