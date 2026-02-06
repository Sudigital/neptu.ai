import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { PrivyProvider } from "@privy-io/expo";
import Constants from "expo-constants";

const PRIVY_APP_ID = Constants.expoConfig?.extra?.privyAppId || "";

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neptu</Text>
      <Text style={styles.subtitle}>Balinese Astrology on Solana</Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID}>
      <HomeScreen />
    </PrivyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
});
