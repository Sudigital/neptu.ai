import { Text, View, TouchableOpacity, Image, Linking } from "react-native";

import type { CryptoData } from "../types";

import { styles } from "../styles";
import { formatCurrency, isBirthdayToday, getAge } from "../utils";

export function CryptoCard({ crypto }: { crypto: CryptoData }) {
  const isBirthday = isBirthdayToday(crypto.birthday);
  const isPriceUp = (crypto.priceChangePercentage24h ?? 0) >= 0;
  const age = getAge(crypto.birthday);

  return (
    <TouchableOpacity
      style={[styles.cryptoCard, isBirthday && styles.cryptoCardBirthday]}
      onPress={() =>
        Linking.openURL(
          `https://neptu.sudigital.com/cryptos/${crypto.symbol.toLowerCase()}`
        )
      }
    >
      <View style={styles.cryptoHeader}>
        {crypto.image ? (
          <Image source={{ uri: crypto.image }} style={styles.cryptoImage} />
        ) : (
          <View style={styles.cryptoImagePlaceholder}>
            <Text style={styles.cryptoImagePlaceholderText}>
              {crypto.symbol.slice(0, 2)}
            </Text>
          </View>
        )}
        <View style={styles.cryptoInfo}>
          <View style={styles.cryptoNameRow}>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
            {isBirthday && <Text style={styles.birthdayBadge}>🎂</Text>}
          </View>
          <Text style={styles.cryptoSymbol}>
            {crypto.symbol} • {age}y old
          </Text>
        </View>
        <View style={styles.cryptoPriceContainer}>
          <Text style={styles.cryptoPrice}>
            {formatCurrency(crypto.currentPrice)}
          </Text>
          <Text
            style={[
              styles.cryptoChange,
              isPriceUp ? styles.priceUp : styles.priceDown,
            ]}
          >
            {isPriceUp ? "+" : ""}
            {crypto.priceChangePercentage24h?.toFixed(2)}%
          </Text>
        </View>
      </View>
      {crypto.cosmicAlignment && (
        <View style={styles.cosmicRow}>
          <Text style={styles.cosmicLabel}>Cosmic Score</Text>
          <View style={styles.cosmicScore}>
            <Text style={styles.cosmicScoreText}>
              {crypto.cosmicAlignment.alignmentScore}%
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
