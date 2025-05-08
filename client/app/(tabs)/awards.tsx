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
  Image,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// API URL configuration
const API_URL =
  Platform.OS === "android"
    ? "http://192.168.0.197:5000"
    : "http://localhost:5000";

interface Reward {
  id: string;
  name: string;
  type: "certificate" | "tshirt";
  description: string;
  unlocked: boolean;
  comingSoon?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

interface RewardsData {
  donations: number;
  tokens: number;
  title: string;
  nextTitle: string | null;
  progress: number;
  achievements: Achievement[];
  rewards: Reward[];
}

export default function AwardsScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRewards = async () => {
    try {
      const response = await fetch(`${API_URL}/api/donations/rewards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRewardsData(data);
      } else {
        console.error("Failed to fetch rewards:", response.status);
        Alert.alert("Error", "Failed to load your rewards information");
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      Alert.alert("Error", "An error occurred while loading your rewards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [token]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={styles.loadingText}>
          Loading your achievements...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!rewardsData) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText style={styles.errorText}>
          Could not load your achievements
        </ThemedText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchRewards();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Hero Section with Title and Tokens */}
      <View style={styles.heroSection}>
        <ThemedText type="title" style={styles.heroTitle}>
          {rewardsData?.title || "New Hero"}
        </ThemedText>

        <View style={styles.tokensContainer}>
          <ThemedText style={styles.tokenValue}>
            {rewardsData?.tokens || 0}
          </ThemedText>
          <ThemedText style={styles.tokenLabel}>Tokens Earned</ThemedText>
        </View>

        <View style={styles.donationStats}>
          <Image
            source={require("@/assets/images/blood-donation.png")}
            style={styles.donationImage}
            resizeMode="contain"
          />
          <View style={styles.donationTextContainer}>
            <ThemedText style={styles.donationCountText}>
              {rewardsData?.donations || 0}
            </ThemedText>
            <ThemedText style={styles.donationLabel}>
              Total Donations
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Progress to Next Title */}
      {rewardsData?.nextTitle ? (
        <View style={styles.progressSection}>
          <ThemedText style={styles.progressTitle}>
            Progress to {rewardsData.nextTitle}
          </ThemedText>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${rewardsData.progress}%` },
              ]}
            />
          </View>
          <ThemedText style={styles.progressText}>
            {rewardsData.progress.toFixed(0)}% Complete
          </ThemedText>
        </View>
      ) : (
        <ThemedView style={styles.maxLevelSection}>
          <ThemedText style={styles.maxLevelText}>
            Congratulations! You've reached the highest title!
          </ThemedText>
          <Ionicons
            name="trophy"
            size={30}
            color={Colors[colorScheme ?? "light"].tint}
          />
        </ThemedView>
      )}

      {/* Achievements Section */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Achievements
        </ThemedText>
        {rewardsData?.achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.lockedAchievement,
            ]}
          >
            <View style={styles.achievementIconContainer}>
              <Ionicons
                name={achievement.unlocked ? "ribbon" : "lock-closed"}
                size={24}
                color={
                  achievement.unlocked
                    ? Colors[colorScheme ?? "light"].tint
                    : Colors[colorScheme ?? "light"].textMuted
                }
              />
            </View>
            <View style={styles.achievementContent}>
              <ThemedText
                style={[
                  styles.achievementName,
                  !achievement.unlocked && styles.lockedText,
                ]}
              >
                {achievement.name}
              </ThemedText>
              <ThemedText
                style={[
                  styles.achievementDescription,
                  !achievement.unlocked && styles.lockedText,
                ]}
              >
                {achievement.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>

      {/* Rewards Section */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Rewards
        </ThemedText>
        {rewardsData?.rewards.map((reward) => (
          <View
            key={reward.id}
            style={[
              styles.rewardCard,
              !reward.unlocked && styles.lockedReward,
            ]}
          >
            <View style={styles.rewardIconContainer}>
              <Ionicons
                name={
                  reward.type === "certificate"
                    ? "document-text"
                    : "shirt"
                }
                size={24}
                color={
                  reward.unlocked
                    ? Colors[colorScheme ?? "light"].tint
                    : Colors[colorScheme ?? "light"].textMuted
                }
              />
              {reward.comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>SOON</Text>
                </View>
              )}
            </View>
            <View style={styles.rewardContent}>
              <ThemedText
                style={[
                  styles.rewardName,
                  !reward.unlocked && styles.lockedText,
                ]}
              >
                {reward.name}
              </ThemedText>
              <ThemedText
                style={[
                  styles.rewardDescription,
                  !reward.unlocked && styles.lockedText,
                ]}
              >
                {reward.description}
              </ThemedText>
            </View>
            {reward.unlocked && !reward.comingSoon && (
              <TouchableOpacity style={styles.claimButton}>
                <ThemedText style={styles.claimButtonText}>Claim</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const windowWidth = Dimensions.get("window").width;

const getStyles = (colorScheme: "light" | "dark" | null | undefined) => {
  const currentColors = Colors[colorScheme ?? "light"];
  return StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentColors.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentColors.background,
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      marginTop: 20,
      marginBottom: 20,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: currentColors.tint,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    heroSection: {
      alignItems: "center",
      padding: 20,
      backgroundColor: currentColors.tint,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 20,
    },
    tokensContainer: {
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 15,
      padding: 15,
      width: "60%",
      marginBottom: 20,
    },
    tokenValue: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#fff",
    },
    tokenLabel: {
      fontSize: 14,
      color: "#fff",
      opacity: 0.9,
    },
    donationStats: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 15,
      padding: 10,
      width: "80%",
    },
    donationImage: {
      width: 40,
      height: 40,
      marginRight: 15,
    },
    donationTextContainer: {
      flex: 1,
    },
    donationCountText: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
    },
    donationLabel: {
      fontSize: 14,
      color: "#fff",
      opacity: 0.9,
    },
    progressSection: {
      padding: 20,
      alignItems: "center",
      backgroundColor: currentColors.card,
      marginHorizontal: 15,
      marginTop: -20,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    progressTitle: {
      fontSize: 16,
      marginBottom: 10,
    },
    progressBarContainer: {
      height: 12,
      backgroundColor: colorScheme === "dark" ? "#444" : "#e0e0e0",
      borderRadius: 6,
      width: "100%",
    },
    progressBar: {
      height: 12,
      backgroundColor: currentColors.tint,
      borderRadius: 6,
    },
    progressText: {
      marginTop: 8,
      fontSize: 14,
      color: currentColors.textMuted,
    },
    maxLevelSection: {
      padding: 20,
      alignItems: "center",
      backgroundColor: currentColors.card,
      marginHorizontal: 15,
      marginTop: -20,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      flexDirection: "row",
      justifyContent: "center",
    },
    maxLevelText: {
      fontSize: 16,
      marginRight: 10,
    },
    sectionContainer: {
      margin: 15,
      padding: 20,
      backgroundColor: currentColors.card,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 15,
      color: currentColors.tint,
    },
    achievementCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      marginBottom: 12,
      backgroundColor: colorScheme === "dark" ? "#2d2d2d" : "#f9f9f9",
      borderRadius: 10,
    },
    lockedAchievement: {
      opacity: 0.6,
    },
    achievementIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colorScheme === "dark" ? "#3d3d3d" : "#f0f0f0",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    achievementContent: {
      flex: 1,
    },
    achievementName: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    achievementDescription: {
      fontSize: 14,
      color: currentColors.textMuted,
    },
    lockedText: {
      color: currentColors.textMuted,
    },
    rewardCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      marginBottom: 12,
      backgroundColor: colorScheme === "dark" ? "#2d2d2d" : "#f9f9f9",
      borderRadius: 10,
    },
    lockedReward: {
      opacity: 0.6,
    },
    rewardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colorScheme === "dark" ? "#3d3d3d" : "#f0f0f0",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
      position: "relative",
    },
    comingSoonBadge: {
      position: "absolute",
      bottom: -5,
      right: -5,
      backgroundColor: currentColors.tint,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    comingSoonText: {
      color: "#fff",
      fontSize: 6,
      fontWeight: "bold",
    },
    rewardContent: {
      flex: 1,
    },
    rewardName: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    rewardDescription: {
      fontSize: 14,
      color: currentColors.textMuted,
    },
    claimButton: {
      backgroundColor: currentColors.tint,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 5,
    },
    claimButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
  });
};
