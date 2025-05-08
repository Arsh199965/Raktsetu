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

// Request status badge colors
const statusColors = {
  pending: { bg: "#FFF8E1", text: "#F57F17" },
  active: { bg: "#E8F5E9", text: "#1B5E20" },
  partially_fulfilled: { bg: "#E3F2FD", text: "#0D47A1" },
  fulfilled: { bg: "#E8F5E9", text: "#00695C" },
  cancelled: { bg: "#FFEBEE", text: "#B71C1C" },
};

// Urgency level colors
const urgencyColors = {
  low: "#78909C",
  medium: "#FF9800",
  high: "#F44336",
  critical: "#B71C1C",
};

interface BloodRequest {
  _id: string;
  bloodType: string;
  hospitalName: string;
  locationDetails: string;
  timeLimit: string;
  urgency: "low" | "medium" | "high" | "critical";
  additionalInfo?: string;
  status:
    | "pending"
    | "active"
    | "partially_fulfilled"
    | "fulfilled"
    | "cancelled";
  confirmedDonors: string[];
  createdAt: string;
  updatedAt: string;
}

export default function MyRequestsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/blood-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error("Failed to fetch blood requests:", response.status);
        Alert.alert("Error", "Failed to load your blood requests");
      }
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      Alert.alert("Error", "An error occurred while loading your requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this blood request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // This is a placeholder for the actual cancellation API
              const response = await fetch(
                `${API_URL}/api/blood-requests/${requestId}/cancel`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                // Update the status locally to avoid refetching
                setRequests((prev) =>
                  prev.map((req) =>
                    req._id === requestId
                      ? { ...req, status: "cancelled" as const }
                      : req
                  )
                );
                Alert.alert("Success", "Request cancelled successfully");
              } else {
                Alert.alert(
                  "Error",
                  "Failed to cancel request. Please try again."
                );
              }
            } catch (error) {
              console.error("Error cancelling request:", error);
              Alert.alert(
                "Error",
                "An error occurred while cancelling request"
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderRequestItem = ({ item }: { item: BloodRequest }) => {
    const isExpired = new Date(item.timeLimit) < new Date();
    const statusStyle = statusColors[item.status];
    const urgencyStyle = urgencyColors[item.urgency];
    const canCancel =
      item.status !== "cancelled" && item.status !== "fulfilled" && !isExpired;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.bloodTypeContainer}>
            <ThemedText style={styles.bloodType}>{item.bloodType}</ThemedText>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase().replace("_", " ")}
            </Text>
          </View>
        </View>

        <ThemedText style={styles.hospitalName}>{item.hospitalName}</ThemedText>
        <ThemedText style={styles.locationDetails}>
          {item.locationDetails}
        </ThemedText>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={urgencyStyle} />
          <ThemedText style={[styles.infoText, { color: urgencyStyle }]}>
            {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}{" "}
            Priority
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={Colors[colorScheme ?? "light"].text}
          />
          <ThemedText style={styles.infoText}>
            Needed by: {formatDate(item.timeLimit)}
            {isExpired && <Text style={styles.expiredText}> (EXPIRED)</Text>}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="people-outline"
            size={16}
            color={Colors[colorScheme ?? "light"].text}
          />
          <ThemedText style={styles.infoText}>
            Donors confirmed: {item.confirmedDonors?.length || 0}
          </ThemedText>
        </View>

        {item.additionalInfo && (
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors[colorScheme ?? "light"].text}
            />
            <ThemedText style={styles.infoText}>
              {item.additionalInfo}
            </ThemedText>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => {
              // Navigate to details page (to be implemented)
              // router.push({ pathname: `/requestDetail/${item._id}` });
              Alert.alert(
                "View Details",
                "Details page will be implemented soon."
              );
            }}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelRequest(item._id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <ThemedText style={styles.dateText}>
          Created: {formatDate(item.createdAt)}
        </ThemedText>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <ThemedView style={styles.emptyContainer}>
      <Ionicons
        name="water-outline"
        size={60}
        color={Colors[colorScheme ?? "light"].textMuted}
      />
      <ThemedText style={styles.emptyText}>No blood requests yet</ThemedText>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/createRequest")}
      >
        <Text style={styles.createButtonText}>Create New Request</Text>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        My Blood Requests
      </ThemedText>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>
            Loading your requests...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/createRequest")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
    title: {
      fontSize: 24,
      textAlign: "center",
      padding: 20,
      marginTop: Platform.OS === "ios" ? 40 : 10,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 90,
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
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    bloodTypeContainer: {
      backgroundColor: currentColors.tint,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 16,
    },
    bloodType: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "bold",
    },
    hospitalName: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 4,
    },
    locationDetails: {
      fontSize: 14,
      marginBottom: 12,
      color: currentColors.textMuted,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      flex: 1,
      fontSize: 14,
    },
    expiredText: {
      color: urgencyColors.critical,
      fontWeight: "bold",
    },
    dateText: {
      fontSize: 12,
      color: currentColors.textMuted,
      marginTop: 8,
      textAlign: "right",
    },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      marginHorizontal: 4,
    },
    viewButton: {
      backgroundColor: currentColors.tint + "20",
      borderWidth: 1,
      borderColor: currentColors.tint,
    },
    cancelButton: {
      backgroundColor: "#FFEBEE",
      borderWidth: 1,
      borderColor: "#B71C1C",
    },
    actionButtonText: {
      color: currentColors.tint,
      fontWeight: "bold",
    },
    cancelButtonText: {
      color: "#B71C1C",
      fontWeight: "bold",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
    },
    emptyText: {
      color: currentColors.textMuted,
      fontSize: 16,
      marginTop: 16,
      marginBottom: 24,
    },
    createButton: {
      backgroundColor: currentColors.tint,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    createButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
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
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      backgroundColor: currentColors.tint,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    },
  });
};
