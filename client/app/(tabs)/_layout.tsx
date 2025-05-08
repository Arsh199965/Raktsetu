import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // Or any icon library you prefer
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

// Screens
import ExploreScreen from "./explore"; // Main screen for requests/donations
import ProfileScreen from "./profile"; // User profile screen
import CreateRequestScreen from "./createRequest"; // For clients to create requests
import MyRequestsScreen from "./myRequests"; // For clients to see their requests
import DonorDashboardScreen from "./donorDashboard"; // For donors to see available requests
import AwardsScreen from "./awards"; // For donors to see their awards and achievements
import CurrentDonationScreen from "./currentDonation"; // For donors to manage their active donations

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole } = useAuth(); // Get user role to customize tabs

  const commonScreenOptions = {
    tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
    tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
    headerShown: false, // Usually, headers are managed by individual screens or a stack navigator
    tabBarStyle: {
      backgroundColor: Colors[colorScheme ?? "light"].background,
      borderTopColor: Colors[colorScheme ?? "light"].tabIconDefault, // Softer border
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "500" as const,
    },
  };

  return (
    <Tab.Navigator screenOptions={commonScreenOptions}>
      {userRole === "client" && (
        <>
          <Tab.Screen
            name="createRequest"
            component={CreateRequestScreen}
            options={{
              title: "New Request",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "add-circle" : "add-circle-outline"}
                  size={26}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="myRequests"
            component={MyRequestsScreen}
            options={{
              title: "My Requests",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "list-circle" : "list-circle-outline"}
                  size={26}
                  color={color}
                />
              ),
            }}
          />
        </>
      )}

      {userRole === "donor" && (
        <>
          <Tab.Screen
            name="donorDashboard"
            component={DonorDashboardScreen}
            options={{
              title: "Find Requests",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "search-circle" : "search-circle-outline"}
                  size={28}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="currentDonation"
            component={CurrentDonationScreen}
            options={{
              title: "Current",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "water" : "water-outline"}
                  size={26}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="awards"
            component={AwardsScreen}
            options={{
              title: "Awards",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "trophy" : "trophy-outline"}
                  size={26}
                  color={color}
                />
              ),
            }}
          />
        </>
      )}

      {/* Common screens for both roles, or if role is not yet defined */}
      <Tab.Screen
        name="explore"
        component={ExploreScreen} // A general explore/info screen if needed, or remove
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
