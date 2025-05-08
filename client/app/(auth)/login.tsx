import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

const API_URL = "http://192.168.0.197:5000"; // Standardized API URL

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    const loginPayload = { phoneNumber, password };
    const url = `${API_URL}/api/auth/login`;
    console.log("[LoginScreen] Attempting to login to:", url);
    console.log("[LoginScreen] Login payload:", JSON.stringify(loginPayload));
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
      });
      const data = await response.json();
      console.log("[LoginScreen] Login response status:", response.status);
      console.log("[LoginScreen] Login response data:", data);
      if (response.ok) {
        await login({ token: data.token, role: data.role });
      } else {
        Alert.alert("Login Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("[LoginScreen] Login fetch error:", error);
      Alert.alert(
        "Login Error",
        `An error occurred during login. ${
          error instanceof Error ? error.message : "Check console for details."
        }`
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Login to Raktsetu
      </ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/(auth)/signup" } as any)}
      >
        <ThemedText style={styles.linkText}>
          Don't have an account? Sign Up
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null | undefined) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: Colors[colorScheme ?? "light"].background,
    },
    title: {
      marginBottom: 20,
      textAlign: "center",
      color: Colors[colorScheme ?? "light"].text,
    },
    input: {
      height: 50,
      borderColor: Colors[colorScheme ?? "light"].tint,
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 10,
      borderRadius: 5,
      color: Colors[colorScheme ?? "light"].text,
      backgroundColor: Colors[colorScheme ?? "light"].card,
    },
    button: {
      backgroundColor: Colors[colorScheme ?? "light"].tint,
      paddingVertical: 15,
      borderRadius: 5,
      alignItems: "center",
      marginBottom: 10,
    },
    buttonText: {
      color: colorScheme === "dark" ? Colors.dark.background : "#fff", // Dynamic text color
      fontWeight: "bold",
      fontSize: 16,
    },
    linkText: {
      marginTop: 15,
      textAlign: "center",
      color: Colors[colorScheme ?? "light"].tint,
    },
  });
