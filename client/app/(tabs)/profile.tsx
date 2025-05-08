import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// API URL configuration
const API_URL =
  Platform.OS === "android"
    ? "http://192.168.0.197:5000"
    : "http://localhost:5000";

interface UserProfile {
  _id: string;
  name: string;
  phoneNumber: string;
  role: "donor" | "client";
  age?: number;
  weight?: number;
  bloodGroup?: string;
  healthInfo?: string[];
  detailsSubmitted?: boolean;
  donations?: number;
  tokens?: number;
  title?: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const { token, userRole, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name);
        setPhoneNumber(data.phoneNumber);
      } else {
        console.error("Failed to fetch user profile:", response.status);
        Alert.alert("Error", "Failed to load your profile information");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "An error occurred while loading your profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleUpdateProfile = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert("Error", "Name and phone number are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phoneNumber }),
      });

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
        // Refresh profile
        fetchProfile();
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Update Failed",
          errorData.message || "Could not update profile"
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An error occurred while updating your profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditDonorDetails = () => {
    router.push("/(donor)/donorDetailsForm");
  };

  // Function to get background color based on tokens
  const getTokenBackgroundColor = (tokens: number) => {
    if (tokens >= 100) return "#FFD700"; // Gold
    if (tokens >= 50) return "#C0C0C0"; // Silver
    if (tokens >= 20) return "#CD7F32"; // Bronze
    return "#9E9E9E"; // Default gray
  };

  // Function to format the joined date
  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={styles.loadingText}>
          Loading your profile...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}
    >
      <ThemedView style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {userRole === "donor" && profile?.title && (
            <View style={styles.badgeContainer}>
              <ThemedText style={styles.badgeText}>{profile.title}</ThemedText>
            </View>
          )}
        </View>

        <ThemedText style={styles.nameText}>{profile?.name}</ThemedText>
        <ThemedText style={styles.roleText}>
          {userRole === "donor" ? "Blood Donor" : "Blood Requester"}
        </ThemedText>

        {userRole === "donor" && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {profile?.donations || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Donations</ThemedText>
            </View>
            <View
              style={[
                styles.statItem,
                {
                  backgroundColor: getTokenBackgroundColor(
                    profile?.tokens || 0
                  ),
                  padding: 10,
                  borderRadius: 8,
                },
              ]}
            >
              <ThemedText style={[styles.statValue, { color: "#FFF" }]}>
                {profile?.tokens || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: "#FFF" }]}>
                Tokens
              </ThemedText>
            </View>
          </View>
        )}
      </ThemedView>

      <View style={styles.contentContainer}>
        {isEditing ? (
          // Edit Mode
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Edit Profile</ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Name</ThemedText>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
                placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
              />
            </View>

            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setName(profile?.name || "");
                  setPhoneNumber(profile?.phoneNumber || "");
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  submitting ? styles.disabledButton : null,
                ]}
                onPress={handleUpdateProfile}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>
                    Save Changes
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View Mode
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Personal Information
                </ThemedText>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Ionicons
                    name="pencil"
                    size={20}
                    color={Colors[colorScheme ?? "light"].tint}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors[colorScheme ?? "light"].textMuted}
                />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Name</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {profile?.name}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors[colorScheme ?? "light"].textMuted}
                />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Phone Number</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {profile?.phoneNumber}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Colors[colorScheme ?? "light"].textMuted}
                />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Joined On</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {profile?.createdAt
                      ? formatJoinedDate(profile.createdAt)
                      : "N/A"}
                  </ThemedText>
                </View>
              </View>
            </View>

            {userRole === "donor" && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>
                    Donor Details
                  </ThemedText>
                  <TouchableOpacity onPress={handleEditDonorDetails}>
                    <Ionicons
                      name="pencil"
                      size={20}
                      color={Colors[colorScheme ?? "light"].tint}
                    />
                  </TouchableOpacity>
                </View>

                {profile?.detailsSubmitted ? (
                  <>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="fitness-outline"
                        size={20}
                        color={Colors[colorScheme ?? "light"].textMuted}
                      />
                      <View style={styles.infoContent}>
                        <ThemedText style={styles.infoLabel}>
                          Blood Group
                        </ThemedText>
                        <ThemedText
                          style={[styles.infoValue, styles.bloodGroupText]}
                        >
                          {profile.bloodGroup || "Not specified"}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons
                        name="body-outline"
                        size={20}
                        color={Colors[colorScheme ?? "light"].textMuted}
                      />
                      <View style={styles.infoContent}>
                        <ThemedText style={styles.infoLabel}>Age</ThemedText>
                        <ThemedText style={styles.infoValue}>
                          {profile.age || "Not specified"}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons
                        name="speedometer-outline"
                        size={20}
                        color={Colors[colorScheme ?? "light"].textMuted}
                      />
                      <View style={styles.infoContent}>
                        <ThemedText style={styles.infoLabel}>Weight</ThemedText>
                        <ThemedText style={styles.infoValue}>
                          {profile.weight
                            ? `${profile.weight} kg`
                            : "Not specified"}
                        </ThemedText>
                      </View>
                    </View>

                    {profile.healthInfo && profile.healthInfo.length > 0 && (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="medkit-outline"
                          size={20}
                          color={Colors[colorScheme ?? "light"].textMuted}
                        />
                        <View style={styles.infoContent}>
                          <ThemedText style={styles.infoLabel}>
                            Health Information
                          </ThemedText>
                          {profile.healthInfo.map((info, index) => (
                            <ThemedText
                              key={index}
                              style={styles.healthInfoItem}
                            >
                              •{" "}
                              {info === "none" ? "No health conditions" : info}
                            </ThemedText>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyDetailsContainer}>
                    <ThemedText style={styles.emptyDetailsText}>
                      You haven't completed your donor details yet.
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={handleEditDonorDetails}
                    >
                      <ThemedText style={styles.completeButtonText}>
                        Complete Your Donor Profile
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {userRole === "donor" && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                  Achievements
                </ThemedText>

                <View style={styles.achievementsContainer}>
                  {(profile?.donations || 0) >= 1 ? (
                    <>
                      <View
                        style={[
                          styles.achievement,
                          { backgroundColor: "#E1F5FE" },
                        ]}
                      >
                        <Ionicons name="trophy" size={24} color="#0288D1" />
                        <ThemedText style={styles.achievementTitle}>
                          First Donation
                        </ThemedText>
                        <ThemedText style={styles.achievementDesc}>
                          You've started your journey as a life saver
                        </ThemedText>
                      </View>

                      {(profile?.donations || 0) >= 5 && (
                        <View
                          style={[
                            styles.achievement,
                            { backgroundColor: "#E8F5E9" },
                          ]}
                        >
                          <Ionicons name="ribbon" size={24} color="#388E3C" />
                          <ThemedText style={styles.achievementTitle}>
                            Regular Donor
                          </ThemedText>
                          <ThemedText style={styles.achievementDesc}>
                            Completed 5 or more blood donations
                          </ThemedText>
                        </View>
                      )}

                      {(profile?.donations || 0) >= 10 && (
                        <View
                          style={[
                            styles.achievement,
                            { backgroundColor: "#FFF3E0" },
                          ]}
                        >
                          <Ionicons name="star" size={24} color="#FF9800" />
                          <ThemedText style={styles.achievementTitle}>
                            Hero Status
                          </ThemedText>
                          <ThemedText style={styles.achievementDesc}>
                            Completed 10 or more blood donations
                          </ThemedText>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyAchievements}>
                      <ThemedText style={styles.emptyAchievementsText}>
                        You haven't made any donations yet. Start donating to
                        earn achievements!
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#fff"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];

  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentColors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    headerContainer: {
      backgroundColor: currentColors.tint,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 30,
      alignItems: "center",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 15,
    },
    avatarInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 40,
      fontWeight: "bold",
      color: currentColors.tint,
    },
    badgeContainer: {
      position: "absolute",
      bottom: 0,
      right: -5,
      backgroundColor: "#fff",
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: currentColors.tint,
    },
    nameText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
    },
    roleText: {
      color: "#fff",
      fontSize: 16,
      opacity: 0.9,
      marginBottom: 15,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      width: "80%",
    },
    statItem: {
      alignItems: "center",
      marginHorizontal: 20,
      minWidth: 80,
    },
    statValue: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
    },
    statLabel: {
      color: "#fff",
      fontSize: 14,
      opacity: 0.9,
    },
    contentContainer: {
      padding: 20,
    },
    section: {
      backgroundColor: currentColors.card,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 15,
    },
    infoRow: {
      flexDirection: "row",
      marginBottom: 20,
    },
    infoContent: {
      marginLeft: 15,
      flex: 1,
    },
    infoLabel: {
      fontSize: 14,
      color: currentColors.textMuted,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
    },
    bloodGroupText: {
      fontWeight: "bold",
      color: currentColors.tint,
      fontSize: 18,
    },
    healthInfoItem: {
      fontSize: 14,
      marginBottom: 2,
    },
    emptyDetailsContainer: {
      alignItems: "center",
      padding: 15,
    },
    emptyDetailsText: {
      textAlign: "center",
      color: currentColors.textMuted,
      marginBottom: 15,
    },
    completeButton: {
      backgroundColor: currentColors.tint,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    completeButtonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    achievementsContainer: {
      marginTop: 5,
    },
    achievement: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      alignItems: "center",
    },
    achievementTitle: {
      fontWeight: "bold",
      fontSize: 16,
      marginVertical: 8,
    },
    achievementDesc: {
      textAlign: "center",
      color: currentColors.textMuted,
      fontSize: 14,
    },
    emptyAchievements: {
      alignItems: "center",
      padding: 15,
    },
    emptyAchievementsText: {
      textAlign: "center",
      color: currentColors.textMuted,
    },
    logoutButton: {
      backgroundColor: "#f44336",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 10,
      marginBottom: 40,
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    inputContainer: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 14,
      color: currentColors.textMuted,
      marginBottom: 5,
    },
    input: {
      backgroundColor: colorScheme === "dark" ? "#333" : "#f5f5f5",
      borderRadius: 8,
      padding: 12,
      color: currentColors.text,
    },
    editButtonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButton: {
      backgroundColor: currentColors.tint,
      marginLeft: 10,
    },
    cancelButton: {
      backgroundColor: colorScheme === "dark" ? "#333" : "#f5f5f5",
      borderWidth: 1,
      borderColor: currentColors.textMuted,
    },
    saveButtonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    cancelButtonText: {
      color: currentColors.textMuted,
    },
    disabledButton: {
      opacity: 0.7,
    },
  });
};
