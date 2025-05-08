import React, { useState, useEffect } from "react";
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

// API_URL, replace with your actual configuration
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

const weightRanges = Array.from({ length: (150 - 45) / 5 + 1 }, (_, i) => {
  const weight = 45 + i * 5;
  return { label: `${weight} kg`, value: weight.toString() };
});

const medicalConditionsList = [
  { id: "hiv", label: "HIV/AIDS" },
  { id: "hepatitis", label: "Hepatitis B or C" },
  { id: "heart_disease", label: "Active Heart Disease" },
  { id: "cancer", label: "Cancer (current or recent)" },
  { id: "malaria", label: "Malaria (in last 6 months)" },
  { id: "std", label: "Active Sexually Transmitted Disease" },
  { id: "none", label: "None of the above" },
];

export default function DonorDetailsFormScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const pickerSelectStyles = getPickerSelectStyles(colorScheme);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState<string | undefined>(undefined);
  const [bloodGroup, setBloodGroup] = useState<string | undefined>(undefined);
  const [selectedHealthInfo, setSelectedHealthInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDonorDetails = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/user/donor-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAge(data.age?.toString() || "");
          setWeight(data.weight?.toString());
          setBloodGroup(data.bloodGroup);
          setSelectedHealthInfo(data.healthInfo || []);
        } else if (response.status !== 404) {
          // 404 means no details yet, which is fine
          Alert.alert("Error", "Failed to fetch donor details.");
        }
      } catch (error) {
        console.error("Fetch donor details error:", error);
        Alert.alert("Error", "An error occurred while fetching details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDonorDetails();
  }, [token]);

  const toggleHealthCondition = (conditionId: string) => {
    if (conditionId === "none") {
      setSelectedHealthInfo(
        selectedHealthInfo.includes("none") ? [] : ["none"]
      );
    } else {
      setSelectedHealthInfo((prev) =>
        prev.includes(conditionId)
          ? prev.filter((id) => id !== conditionId && id !== "none")
          : [...prev.filter((id) => id !== "none"), conditionId]
      );
    }
  };

  const handleSubmit = async () => {
    if (!age || !weight || !bloodGroup) {
      Alert.alert(
        "Validation Error",
        "Please fill in Age, Weight, and Blood Group."
      );
      return;
    }
    if (selectedHealthInfo.length === 0) {
      Alert.alert(
        "Validation Error",
        'Please select at least one health condition (or "None of the above").'
      );
      return;
    }

    const payload = {
      age: parseInt(age, 10),
      weight: parseInt(weight, 10),
      bloodGroup,
      healthInfo: selectedHealthInfo,
    };

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/user/donor-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert("Success", "Donor details updated successfully!");
        router.back(); // Or navigate to profile
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Update Failed",
          errorData.message || "Could not update details."
        );
      }
    } catch (error) {
      console.error("Update donor details error:", error);
      Alert.alert("Error", "An error occurred while updating details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={{ marginTop: 20 }}>
          Loading donor details...
        </ThemedText>
      </ThemedView>
    );
  }

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
          My Donor Details
        </ThemedText>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Personal Information
          </ThemedText>

          <ThemedText style={styles.label}>Age (Years)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
          />

          <ThemedText style={styles.label}>Weight</ThemedText>
          <RNPickerSelect
            onValueChange={(value) => setWeight(value)}
            items={weightRanges}
            style={pickerSelectStyles}
            value={weight}
            placeholder={{ label: "Select your weight", value: null }}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <Ionicons
                name="chevron-down"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            )}
          />

          <ThemedText style={styles.label}>Blood Group</ThemedText>
          <RNPickerSelect
            onValueChange={(value) => setBloodGroup(value)}
            items={bloodGroups}
            style={pickerSelectStyles}
            value={bloodGroup}
            placeholder={{ label: "Select your blood group", value: null }}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <Ionicons
                name="chevron-down"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            )}
          />
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Health Information
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Please select any conditions that apply to you. This is crucial for
            safe blood donation.
          </ThemedText>

          {medicalConditionsList.map((condition) => (
            <TouchableOpacity
              key={condition.id}
              style={styles.checkboxContainer}
              onPress={() => toggleHealthCondition(condition.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedHealthInfo.includes(condition.id) &&
                    styles.checkboxSelected,
                ]}
              >
                {selectedHealthInfo.includes(condition.id) && (
                  <Text style={styles.checkboxCheckmark}>✓</Text>
                )}
              </View>
              <ThemedText style={styles.checkboxLabel}>
                {condition.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save Details</Text>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

// Enhanced styling
const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];
  return StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: currentColors.background,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
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
    subtitle: {
      fontSize: 14,
      color: currentColors.textMuted,
      marginBottom: 15,
      lineHeight: 20,
    },
    input: {
      height: 50,
      borderColor: currentColors.tint,
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 12,
      borderRadius: 8,
      color: currentColors.text,
      backgroundColor: currentColors.background,
      fontSize: 16,
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
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingVertical: 5,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: currentColors.tint,
      borderRadius: 6,
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxSelected: {
      backgroundColor: currentColors.tint,
    },
    checkboxCheckmark: {
      color: colorScheme === "dark" ? Colors.dark.background : "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    checkboxLabel: {
      fontSize: 16,
      color: currentColors.text,
      flex: 1,
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
