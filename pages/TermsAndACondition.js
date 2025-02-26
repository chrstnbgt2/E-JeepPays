import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const TermsAndConditionsScreen = () => {
  const navigation = useNavigation();
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
      </View>

      {/* Terms Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms and Conditions</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By using this mobile application, you agree to abide by these Terms and Conditions. Continued use of the app
          constitutes acceptance of any future modifications.
        </Text>

        <Text style={styles.sectionTitle}>2. User Eligibility</Text>
        <Text style={styles.text}>
          The application is available for registered drivers, conductors, and passengers using modern jeepneys in
          Zamboanga City. Users must provide valid information during registration.
        </Text>

        <Text style={styles.sectionTitle}>3. Cashless Payment Policy</Text>
        <Text style={styles.text}>
          All transactions processed through the app are final. Users are responsible for ensuring they have sufficient
          balance (minimum of 50php) or valid payment methods before riding the jeepney.
        </Text>

        <Text style={styles.sectionTitle}>4. Temporary QR Code for Insufficient Balance</Text>
        <Text style={styles.text}>
          If a user does not have the minimum balance of 50php, the conductor may generate a temporary QR code to allow
          them to complete their ride. However, the user must immediately settle the fare in cash before the ride
          continues. Failure to do so may result in denial of service or account restrictions.
        </Text>

        <Text style={styles.sectionTitle}>5. Fare Rates and Charges</Text>
        <Text style={styles.text}>
          The transport operators determine fares and are subject to change without prior notice. The app displays the
          current fare for transparency.
        </Text>

        <Text style={styles.sectionTitle}>6. No Refund Policy</Text>
        <Text style={styles.text}>
          Refunds for completed transactions are not permitted except in cases of verified system errors. Disputes must
          be reported within 24 hours.
        </Text>

        <Text style={styles.sectionTitle}>7. Seat Availability Accuracy</Text>
        <Text style={styles.text}>
          The app provides real-time seat availability updates, but drivers and conductors have the final authority in
          case of discrepancies.
        </Text>

        <Text style={styles.sectionTitle}>8. User Responsibilities</Text>
        <Text style={styles.text}>
          Users must ensure the accuracy of their account details and maintain the security of their login credentials.
          Any misuse of the account is the user’s responsibility.
        </Text>

        <Text style={styles.sectionTitle}>9. Data Privacy and Security</Text>
        <Text style={styles.text}>
          The app collects and processes personal data in accordance with applicable data protection laws. User data
          will not be shared with third parties without consent, except when required by law.
        </Text>

        <Text style={styles.sectionTitle}>10. Driver and Conductor Responsibilities</Text>
        <Text style={styles.text}>
          Drivers and conductors must update seat availability accurately and ensure that the payment process through
          the app is seamless for passengers.
        </Text>

        <Text style={styles.sectionTitle}>11. Real-Time Tracking Disclaimer</Text>
        <Text style={styles.text}>
          The real-time GPS tracking feature depends on mobile network availability. Delays or inaccuracies may occur
          due to network issues or technical limitations.
        </Text>

        <Text style={styles.sectionTitle}>12. Prohibited Activities</Text>
        <Text style={styles.text}>
          Users must not manipulate fare charges, engage in fraudulent transactions, or misuse the app for purposes
          other than its intended function. Violations may lead to account suspension or legal action.
        </Text>

        <Text style={styles.sectionTitle}>13. Account Suspension and Termination</Text>
        <Text style={styles.text}>
          Users who violate these terms, engage in fraudulent activities, or abuse the system may have their accounts
          suspended or permanently terminated without prior notice.
        </Text>

        <Text style={styles.sectionTitle}>14. Modification of Terms</Text>
        <Text style={styles.text}>
          The company reserves the right to update these Terms and Conditions at any time. Users will be notified of
          significant changes via the app.
        </Text>

        <Text style={styles.sectionTitle}>15. Force Majeure</Text>
        <Text style={styles.text}>
          The app provider is not responsible for service interruptions due to natural disasters, system failures,
          strikes, or other unforeseen circumstances beyond its control.
        </Text>

        <Text style={styles.sectionTitle}>16. Third-Party Integrations</Text>
        <Text style={styles.text}>
          The app may integrate with third-party services such as payment gateways and mapping services. The provider is
          not liable for issues arising from third-party services.
        </Text>

        <Text style={styles.sectionTitle}>17. System Downtime and Maintenance</Text>
        <Text style={styles.text}>
          The app may be temporarily unavailable due to maintenance, updates, or unexpected technical issues. The
          company is not liable for any inconvenience caused.
        </Text>
      </ScrollView>

      {/* Accept Button */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setAccepted(!accepted)} style={styles.checkboxContainer}>
          <Ionicons name={accepted ? "checkbox" : "square-outline"} size={24} color="#A5BE7D" />
          <Text style={styles.checkboxText}>I accept the Terms & Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !accepted && styles.disabledButton]}
          disabled={!accepted}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#466B66",
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: { marginRight: 15 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 15, color: "#466B66" },
  text: { fontSize: 14, color: "#555", lineHeight: 20 },
  footer: { padding: 20, borderTopWidth: 1, borderColor: "#ddd" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  checkboxText: { marginLeft: 10, fontSize: 14, color: "#333" },
  button: { backgroundColor: "#466B66", padding: 12, borderRadius: 8, alignItems: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
