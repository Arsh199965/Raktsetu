import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

const API_URL = "http://192.168.0.197:5000";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"donor" | "client">("client");

  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { login } = useAuth();

  const handleSignUp = async () => {
    if (!name || !phoneNumber || !password) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Name, Phone, Password)."
      );
      return;
    }

    const signupPayload: any = { name, phoneNumber, password, role };
    const url = `${API_URL}/api/auth/signup`;

    console.log("[SignUpScreen] Attempting to signup to:", url);
    console.log(
      "[SignUpScreen] Signup payload:",
      JSON.stringify(signupPayload)
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      });
      const data = await response.json();
      console.log("[SignUpScreen] Signup response status:", response.status);
      console.log("[SignUpScreen] Signup response data:", data);

      if (response.ok) {
        await login({ token: data.token, role: signupPayload.role });
      } else {
        Alert.alert("Sign Up Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("[SignUpScreen] Signup fetch error:", error);
      Alert.alert(
        "Sign Up Error",
        `An error occurred during sign up. ${
          error instanceof Error ? error.message : "Check console for details."
        }`
      );
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
          Create Account
        </ThemedText>

        <View style={styles.roleSelectorContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "client" && styles.roleButtonActive,
            ]}
            onPress={() => setRole("client")}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "client" && styles.roleButtonTextActive,
              ]}
            >
              I Need Blood (Client)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "donor" && styles.roleButtonActive,
            ]}
            onPress={() => setRole("donor")}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "donor" && styles.roleButtonTextActive,
              ]}
            >
              I Want to Donate (Donor)
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
        />
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

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(auth)/login" } as any)}
        >
          <ThemedText style={styles.linkText}>
            Already have an account? Login
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];
  return StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
    },
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: currentColors.background,
    },
    title: {
      marginBottom: 20,
      textAlign: "center",
      color: currentColors.text,
    },
    subtitle: {
      marginTop: 15,
      marginBottom: 10,
      textAlign: "center",
      color: currentColors.text,
    },
    input: {
      height: 50,
      borderColor: currentColors.tint,
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 10,
      borderRadius: 8,
      color: currentColors.text,
      backgroundColor: currentColors.card,
      fontSize: 16,
    },
    button: {
      backgroundColor: currentColors.tint,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 10,
      marginTop: 10,
    },
    buttonText: {
      color: colorScheme === "dark" ? Colors.dark.background : "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    linkText: {
      marginTop: 15,
      textAlign: "center",
      color: currentColors.tint,
    },
    roleSelectorContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: currentColors.tint,
      borderRadius: 8,
      overflow: "hidden",
    },
    roleButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: currentColors.card,
    },
    roleButtonActive: {
      backgroundColor: currentColors.tint,
    },
    roleButtonText: {
      color: currentColors.text,
      fontWeight: "600",
    },
    roleButtonTextActive: {
      color: "#FFFFFF",
    },
  });
};
