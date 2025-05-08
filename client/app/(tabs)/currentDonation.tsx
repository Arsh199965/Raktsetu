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
  Linking,
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

interface AcceptedRequest {
  _id: string;
  bloodType: string;
  hospitalName: string;
  locationDetails: string;
  timeLimit: string;
  urgency: "low" | "medium" | "high" | "critical";
  clientId: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  status: string;
  createdAt: string;
}

export default function CurrentDonationScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [acceptedRequests, setAcceptedRequests] = useState<AcceptedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchAcceptedRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/blood-requests/accepted`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAcceptedRequests(data);
      } else {
        console.error("Failed to fetch accepted requests:", response.status);
        Alert.alert("Error", "Failed to load your accepted blood requests");
      }
    } catch (error) {
      console.error("Error fetching accepted requests:", error);
      Alert.alert("Error", "An error occurred while loading your accepted requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedRequests();
  }, [token]);

  const handleCallClient = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleArrived = async (requestId: string) => {
    Alert.alert(
      "Confirm Arrival",
      "Have you arrived at the hospital?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, I'm here",
          onPress: async () => {
            setSubmitting(true);
            setCompletingId(requestId);
            
            try {
              const response = await fetch(`${API_URL}/api/blood-requests/${requestId}/arrived`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });

              if (response.ok) {
                Alert.alert(
                  "Success",
                  "Thank you for notifying your arrival. The client has been notified. Please proceed with the donation."
                );
                fetchAcceptedRequests(); // Refresh the list
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.message || "Failed to record your arrival"
                );
              }
            } catch (error) {
              console.error("Error recording arrival:", error);
              Alert.alert("Error", "An error occurred while recording your arrival");
            } finally {
              setSubmitting(false);
              setCompletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCompleteDonation = async (requestId: string) => {
    Alert.alert(
      "Complete Donation",
      "Have you completed your donation?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Completed",
          onPress: async () => {
            setSubmitting(true);
            setCompletingId(requestId);
            
            try {
              // Calculate rough arrival time (just for demo - would be more accurate in real app)
              // Here we're just using a random value between 15-60 minutes
              const arrivalTime = Math.floor(Math.random() * 46) + 15;
              
              const response = await fetch(`${API_URL}/api/donations/complete/${requestId}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ arrivalTime }),
              });

              if (response.ok) {
                const data = await response.json();
                Alert.alert(
                  "Donation Completed",
                  `Thank you for your donation! You've earned ${data.tokensAwarded} tokens. Your total is now ${data.totalTokens}.`
                );
                fetchAcceptedRequests(); // Refresh the list
                
                // Navigate to awards screen to show new tokens/rewards
                setTimeout(() => {
                  router.push("/(tabs)/awards");
                }, 1500);
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.message || "Failed to record your donation"
                );
              }
            } catch (error) {
              console.error("Error completing donation:", error);
              Alert.alert("Error", "An error occurred while recording your donation");
            } finally {
              setSubmitting(false);
              setCompletingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return '#B71C1C';
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#78909C';
      default:
        return '#78909C';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={{ marginTop: 20 }}>
          Loading your donations...
        </ThemedText>
      </ThemedView>
    );
  }

  if (acceptedRequests.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons
          name="water-outline"
          size={70}
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={styles.emptyTitle}>No Active Donations</ThemedText>
        <ThemedText style={styles.emptyText}>
          You don't have any active donation requests at the moment. Check the "Find Requests" tab to help someone in need!
        </ThemedText>
        <TouchableOpacity
          style={styles.findRequestsButton}
          onPress={() => router.push("/(tabs)/donorDashboard")}
        >
          <Text style={styles.findRequestsButtonText}>Find Requests</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: Colors[colorScheme ?? "light"].background 
      }} 
      contentContainerStyle={styles.container}
    >
      <ThemedText type="title" style={styles.headerTitle}>
        Your Current Donations
      </ThemedText>
      <ThemedText style={styles.headerSubtitle}>
        Track your ongoing donation activities
      </ThemedText>

      {acceptedRequests.map(request => (
        <View key={request._id} style={styles.donationCard}>
          <View style={styles.cardHeader}>
            <View style={styles.bloodTypeContainer}>
              <Text style={styles.bloodTypeText}>{request.bloodType}</Text>
            </View>
            <View 
              style={[
                styles.urgencyBadge, 
                { backgroundColor: getUrgencyColor(request.urgency) + "20", borderColor: getUrgencyColor(request.urgency) }
              ]}
            >
              <Text style={[styles.urgencyText, { color: getUrgencyColor(request.urgency) }]}>
                {request.urgency.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardSection}>
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
              <ThemedText style={styles.hospitalName}>{request.hospitalName}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
              <ThemedText style={styles.locationText}>{request.locationDetails}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
              <ThemedText style={styles.timeText}>
                Needed by: {formatDateTime(request.timeLimit)}
              </ThemedText>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={Colors[colorScheme ?? "light"].tint} />
              <ThemedText style={styles.clientName}>
                Client: {request.clientId.name}
              </ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => handleCallClient(request.clientId.phoneNumber)}
            >
              <Ionicons name="call" size={18} color="#FFF" />
              <Text style={styles.callButtonText}>Call Client</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.arrivedButton]}
              onPress={() => handleArrived(request._id)}
              disabled={submitting}
            >
              {completingId === request._id && submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>I've Arrived</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleCompleteDonation(request._id)}
              disabled={submitting}
            >
              {completingId === request._id && submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];
  return StyleSheet.create({
    container: {
      padding: 15,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentColors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 30,
      backgroundColor: currentColors.background,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 20,
      marginBottom: 10,
    },
    emptyText: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 30,
      color: currentColors.textMuted,
    },
    findRequestsButton: {
      backgroundColor: currentColors.tint,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    findRequestsButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: currentColors.textMuted,
      marginBottom: 20,
    },
    donationCard: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      backgroundColor: colorScheme === "dark" ? "#2d2d2d" : "#f5f5f5",
    },
    bloodTypeContainer: {
      backgroundColor: currentColors.tint,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    bloodTypeText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 16,
    },
    urgencyBadge: {
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
    },
    urgencyText: {
      fontWeight: "bold",
      fontSize: 12,
    },
    cardSection: {
      padding: 15,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    hospitalName: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
    locationText: {
      fontSize: 14,
      flex: 1,
      marginLeft: 10,
    },
    timeText: {
      fontSize: 14,
      marginLeft: 10,
    },
    divider: {
      height: 1,
      backgroundColor: colorScheme === "dark" ? "#444" : "#e0e0e0",
      marginVertical: 12,
    },
    clientName: {
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 10,
    },
    callButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#4CAF50",
      padding: 10,
      borderRadius: 8,
      marginTop: 12,
      justifyContent: "center",
    },
    callButtonText: {
      color: "#FFF",
      fontWeight: "bold",
      marginLeft: 6,
    },
    actionContainer: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colorScheme === "dark" ? "#444" : "#e0e0e0",
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
    },
    arrivedButton: {
      backgroundColor: "#FF9800",
      borderRightWidth: 1,
      borderRightColor: colorScheme === "dark" ? "#333" : "#f0f0f0",
    },
    completeButton: {
      backgroundColor: currentColors.tint,
    },
    actionButtonText: {
      color: "#FFF",
      fontWeight: "bold",
      marginLeft: 6,
    },
  });
};
