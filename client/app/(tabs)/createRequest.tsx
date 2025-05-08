import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

// API_URL configuration
const API_URL =
  Platform.OS === "android"
    ? "http://192.168.0.197:5000"
    : "http://localhost:5000";

const bloodGroups = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

const urgencyLevels = [
  { label: "Low - Within a few days", value: "low" },
  { label: "Medium - Within 24 hours", value: "medium" },
  { label: "High - Within a few hours", value: "high" },
  { label: "Critical - Immediately", value: "critical" },
];

export default function CreateRequestScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const pickerSelectStyles = getPickerSelectStyles(colorScheme);

  const [bloodType, setBloodType] = useState<string | undefined>(undefined);
  const [hospitalName, setHospitalName] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [timeLimit, setTimeLimit] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  ); // Default to 24 hours from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [urgency, setUrgency] = useState<string | undefined>("medium");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || timeLimit;
    setShowDatePicker(Platform.OS === "ios");
    setTimeLimit(currentDate);
  };

  const handleSubmit = async () => {
    if (!bloodType || !hospitalName || !locationDetails || !urgency) {
      Alert.alert(
        "Validation Error",
        "Please fill all required fields: Blood Type, Hospital, Location, and Urgency."
      );
      return;
    }
    if (timeLimit <= new Date()) {
      Alert.alert("Validation Error", "Time limit must be in the future.");
      return;
    }

    const payload = {
      bloodType,
      hospitalName,
      locationDetails,
      timeLimit: timeLimit.toISOString(),
      urgency,
      additionalInfo,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/blood-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "Blood request created successfully!");
        // Navigate to MyRequestsScreen
        router.push({ pathname: "/(tabs)/myRequests" } as any);
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Creation Failed",
          errorData.message || "Could not create blood request."
        );
      }
    } catch (error) {
      console.error("Create blood request error:", error);
      Alert.alert("Error", "An error occurred while creating the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: Colors[colorScheme ?? "light"].background,
      }}
      contentContainerStyle={styles.scrollContainer}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Create Blood Request
        </ThemedText>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Request Details
          </ThemedText>

          <ThemedText style={styles.label}>Blood Type Needed*</ThemedText>
          <RNPickerSelect
            onValueChange={(value) => setBloodType(value)}
            items={bloodGroups}
            style={pickerSelectStyles}
            value={bloodType}
            placeholder={{ label: "Select blood type", value: null }}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <Ionicons
                name="chevron-down"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            )}
          />

          <ThemedText style={styles.label}>Hospital Name*</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g., City General Hospital"
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
          />

          <ThemedText style={styles.label}>Location Details*</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Ward 5, 123 Main St, Anytown"
            value={locationDetails}
            onChangeText={setLocationDetails}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
          />
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Timing & Urgency
          </ThemedText>

          <ThemedText style={styles.label}>Needed By (Date & Time)*</ThemedText>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
            <ThemedText>{timeLimit.toLocaleString()}</ThemedText>
            <Ionicons
              name="calendar"
              size={22}
              color={Colors[colorScheme ?? "light"].tint}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={timeLimit}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <ThemedText style={styles.label}>Urgency Level*</ThemedText>
          <RNPickerSelect
            onValueChange={(value) => setUrgency(value)}
            items={urgencyLevels}
            style={pickerSelectStyles}
            value={urgency}
            placeholder={{ label: "Select urgency level", value: null }}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <Ionicons
                name="chevron-down"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            )}
          />

          <ThemedText style={styles.label}>
            Additional Information (Optional)
          </ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Patient contact, specific instructions for donors"
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];
  return StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentColors.background,
    },
    title: {
      marginBottom: 20,
      textAlign: "center",
      fontSize: 28,
    },
    card: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      marginBottom: 15,
      color: currentColors.tint,
    },
    label: {
      fontSize: 16,
      color: currentColors.text,
      marginBottom: 8,
      fontWeight: "500",
    },
    input: {
      borderColor: currentColors.tint,
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: currentColors.text,
      backgroundColor: currentColors.background,
      fontSize: 16,
      minHeight: 48,
    },
    datePickerButton: {
      borderColor: currentColors.tint,
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: currentColors.background,
      minHeight: 48,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: "top", // For Android
      paddingTop: 10, // For iOS
    },
    button: {
      backgroundColor: currentColors.tint,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
      marginBottom: 20,
    },
    buttonDisabled: {
      backgroundColor: colorScheme === "dark" ? "#444" : "#aaa",
    },
    buttonText: {
      color: colorScheme === "dark" ? Colors.dark.background : "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    smallHint: {
      fontSize: 12,
      color: currentColors.textMuted,
      marginBottom: 10,
      marginTop: -5,
    },
  });
};

// Styles for RNPickerSelect
const getPickerSelectStyles = (
  colorScheme: "light" | "dark" | null | undefined
) => {
  const currentColors = Colors[colorScheme ?? "light"];
  return {
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: currentColors.tint,
      borderRadius: 8,
      color: currentColors.text,
      paddingRight: 30,
      backgroundColor: currentColors.background,
      marginBottom: 15,
      height: 50,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: currentColors.tint,
      borderRadius: 8,
      color: currentColors.text,
      paddingRight: 30,
      backgroundColor: currentColors.background,
      marginBottom: 15,
      height: 50,
    },
    placeholder: { color: currentColors.textMuted },
    iconContainer: { top: 12, right: 12 },
  };
};
