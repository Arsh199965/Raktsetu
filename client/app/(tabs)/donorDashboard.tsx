import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Platform,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

// Urgency level colors and priorities
const urgencyConfig = {
  low: { color: "#78909C", priority: 1 },
  medium: { color: "#FF9800", priority: 2 },
  high: { color: "#F44336", priority: 3 },
  critical: { color: "#B71C1C", priority: 4 },
};

interface BloodRequest {
  _id: string;
  bloodType: string;
  hospitalName: string;
  locationDetails: string;
  timeLimit: string;
  urgency: "low" | "medium" | "high" | "critical";
  additionalInfo?: string;
  status: string;
  clientId: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  createdAt: string;
  updatedAt: string;
  distance?: number; // This would be calculated if we had location data
  isMatching?: boolean; // Whether donor's blood group matches
}

export default function DonorDashboardScreen() {
  const { token, userRole } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [userBloodGroup, setUserBloodGroup] = useState<string | null>(null);

  // Function to check if donor has submitted their details
  const checkDonorDetailsSubmitted = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/donor-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.bloodGroup) {
          setUserBloodGroup(data.bloodGroup);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking donor details:", error);
      return false;
    }
  };

  // Function to fetch available blood requests
  const fetchRequests = async () => {
    try {
      // First check if donor details are submitted
      const detailsSubmitted = await checkDonorDetailsSubmitted();

      if (!detailsSubmitted) {
        Alert.alert(
          "Profile Incomplete",
          "Please complete your donor profile before viewing requests.",
          [
            {
              text: "Complete Profile",
              onPress: () => router.push("/(donor)/donorDetailsForm"),
            },
          ]
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/blood-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Mark requests that match donor's blood group
        const markedData = data.map((req: BloodRequest) => ({
          ...req,
          isMatching: isBloodTypeCompatible(
            userBloodGroup || "",
            req.bloodType
          ),
        }));

        // Sort by urgency (higher priority first), then by matching (matching first), then by date (newest first)
        const sortedData = markedData.sort(
          (a: BloodRequest, b: BloodRequest) => {
            // First by urgency
            const urgencyDiff =
              urgencyConfig[b.urgency].priority -
              urgencyConfig[a.urgency].priority;
            if (urgencyDiff !== 0) return urgencyDiff;

            // Then by matching status
            if (a.isMatching && !b.isMatching) return -1;
            if (!a.isMatching && b.isMatching) return 1;

            // Then by date (newest first)
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        );

        setRequests(sortedData);
      } else {
        console.error("Failed to fetch blood requests:", response.status);
        Alert.alert("Error", "Failed to load available blood requests");
      }
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      Alert.alert("Error", "An error occurred while loading requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check blood type compatibility
  const isBloodTypeCompatible = (donorType: string, requestType: string) => {
    // This is a simplified compatibility check
    // In a real app, you would implement full blood type compatibility rules
    if (donorType === requestType) return true;
    if (donorType === "O-") return true; // Universal donor
    if (donorType === "O+" && requestType.includes("+")) return true;
    if (donorType === "A-" && (requestType === "A-" || requestType === "AB-"))
      return true;
    if (donorType === "A+" && (requestType === "A+" || requestType === "AB+"))
      return true;
    if (donorType === "B-" && (requestType === "B-" || requestType === "AB-"))
      return true;
    if (donorType === "B+" && (requestType === "B+" || requestType === "AB+"))
      return true;
    if (donorType === "AB-" && requestType === "AB-") return true;
    if (donorType === "AB+" && requestType === "AB+") return true;
    return false;
  };

  useEffect(() => {
    if (userRole === "donor") {
      fetchRequests();
    }
  }, [token, userRole]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAcceptRequest = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      const response = await fetch(
        `${API_URL}/api/blood-requests/${requestId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        Alert.alert(
          "Request Accepted",
          "You've successfully accepted this blood request. Please proceed to the hospital as soon as possible. The client will be notified."
        );

        // You could redirect to a detail page or update the UI
        // For now, just refresh the list
        fetchRequests();
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.message || "Failed to accept request. Please try again."
        );
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "An error occurred while accepting the request");
    } finally {
      setAcceptingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderRequestItem = ({ item }: { item: BloodRequest }) => {
    const isExpired = new Date(item.timeLimit) < new Date();
    const urgencyStyle = urgencyConfig[item.urgency].color;
    const isAccepting = acceptingId === item._id;

    // Calculate remaining time
    const now = new Date();
    const deadline = new Date(item.timeLimit);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHrs = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const diffMins = Math.max(
      0,
      Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    );

    const timeRemainingText = isExpired
      ? "EXPIRED"
      : `${diffHrs}h ${diffMins}m remaining`;

    return (
      <View
        style={[
          styles.requestCard,
          item.isMatching ? styles.matchingCard : {},
          isExpired ? styles.expiredCard : {},
        ]}
      >
        {item.isMatching && (
          <View style={styles.matchingBanner}>
            <Text style={styles.matchingText}>MATCHING BLOOD TYPE</Text>
          </View>
        )}

        <View style={styles.requestHeader}>
          <View style={styles.bloodTypeContainer}>
            <ThemedText style={styles.bloodType}>{item.bloodType}</ThemedText>
          </View>
          <View
            style={[
              styles.urgencyBadge,
              {
                backgroundColor: urgencyStyle + "20",
                borderColor: urgencyStyle,
              },
            ]}
          >
            <Text style={[styles.urgencyText, { color: urgencyStyle }]}>
              {item.urgency.toUpperCase()}
            </Text>
          </View>
        </View>

        <ThemedText style={styles.hospitalName}>{item.hospitalName}</ThemedText>
        <ThemedText style={styles.locationDetails}>
          {item.locationDetails}
        </ThemedText>

        <View style={styles.timeContainer}>
          <Ionicons
            name="time-outline"
            size={18}
            color={isExpired ? "#B71C1C" : Colors[colorScheme ?? "light"].text}
          />
          <ThemedText
            style={[
              styles.timeRemainingText,
              isExpired ? styles.expiredText : {},
            ]}
          >
            {timeRemainingText}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors[colorScheme ?? "light"].textMuted}
            />
            <ThemedText style={styles.infoText}>
              Needed by: {formatDate(item.timeLimit)}
            </ThemedText>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="person-outline"
              size={16}
              color={Colors[colorScheme ?? "light"].textMuted}
            />
            <ThemedText style={styles.infoText}>
              Client: {item.clientId.name}
            </ThemedText>
          </View>
        </View>

        {item.additionalInfo && (
          <View style={styles.additionalInfoContainer}>
            <ThemedText style={styles.additionalInfoTitle}>
              Additional Information:
            </ThemedText>
            <ThemedText style={styles.additionalInfoText}>
              {item.additionalInfo}
            </ThemedText>
          </View>
        )}

        {!isExpired && (
          <TouchableOpacity
            style={[
              styles.acceptButton,
              isAccepting ? styles.acceptingButton : null,
              !item.isMatching ? styles.nonMatchingButton : null,
            ]}
            onPress={() => handleAcceptRequest(item._id)}
            disabled={isAccepting || !item.isMatching}
          >
            {isAccepting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="heart"
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>
                  {item.isMatching
                    ? "Accept Request"
                    : "Blood Type Not Compatible"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <ThemedView style={styles.emptyContainer}>
      <Image
        source={require("@/assets/images/blood-donation.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText style={styles.emptyTitle}>
        No active blood requests
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        When someone needs blood that matches your type, requests will appear
        here. Check back soon or enable notifications to be alerted immediately.
      </ThemedText>
    </ThemedView>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ThemedText style={styles.headerTitle}>Available Requests</ThemedText>
      {userBloodGroup && (
        <ThemedText style={styles.bloodGroupText}>
          Your blood group:{" "}
          <Text style={styles.bloodGroupHighlight}>{userBloodGroup}</Text>
        </ThemedText>
      )}
      <ThemedText style={styles.headerSubtitle}>
        Matching requests are highlighted and shown first
      </ThemedText>
    </View>
  );

  if (userRole !== "donor") {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>
          This screen is only available for donors.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>
            Loading blood requests...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors[colorScheme ?? "light"].tint]}
              tintColor={Colors[colorScheme ?? "light"].tint}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentColors.background,
    },
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      textAlign: "center",
      color: currentColors.textMuted,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 60 : 30,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: currentColors.text,
      marginBottom: 12,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: 14,
      color: currentColors.textMuted,
      textAlign: "center",
      marginTop: 4,
    },
    bloodGroupText: {
      fontSize: 16,
      color: currentColors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    bloodGroupHighlight: {
      fontWeight: "bold",
      color: currentColors.tint,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    requestCard: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: "transparent",
    },
    matchingCard: {
      borderColor: "#4CAF50",
      borderWidth: 2,
    },
    expiredCard: {
      opacity: 0.7,
    },
    matchingBanner: {
      backgroundColor: "#4CAF5020",
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 4,
      position: "absolute",
      top: -10,
      right: 16,
      borderWidth: 1,
      borderColor: "#4CAF50",
    },
    matchingText: {
      color: "#4CAF50",
      fontSize: 10,
      fontWeight: "bold",
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    bloodTypeContainer: {
      backgroundColor: currentColors.tint,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      minWidth: 50,
      alignItems: "center",
    },
    bloodType: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 18,
    },
    urgencyBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 16,
      borderWidth: 1,
    },
    urgencyText: {
      fontSize: 10,
      fontWeight: "bold",
    },
    hospitalName: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 4,
    },
    locationDetails: {
      fontSize: 14,
      color: currentColors.textMuted,
      marginBottom: 12,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    timeRemainingText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    expiredText: {
      color: "#B71C1C",
    },
    divider: {
      height: 1,
      backgroundColor: currentColors === Colors.dark ? "#333" : "#eee",
      marginVertical: 12,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    infoText: {
      marginLeft: 4,
      fontSize: 12,
      color: currentColors.textMuted,
    },
    additionalInfoContainer: {
      marginBottom: 16,
      backgroundColor: currentColors === Colors.dark ? "#222" : "#f5f5f5",
      padding: 10,
      borderRadius: 8,
    },
    additionalInfoTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
    },
    additionalInfoText: {
      fontSize: 14,
      color: currentColors.textMuted,
    },
    acceptButton: {
      backgroundColor: "#4CAF50",
      padding: 12,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    acceptingButton: {
      backgroundColor: "#888",
    },
    nonMatchingButton: {
      backgroundColor: "#9E9E9E",
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    buttonIcon: {
      marginRight: 8,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyImage: {
      width: 150,
      height: 150,
      marginBottom: 20,
      opacity: 0.8,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 14,
      color: currentColors.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
  });
};
