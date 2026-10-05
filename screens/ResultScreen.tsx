import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';



export default function ResultScreen() {
  const { message, query } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Result Screen</Text>
      <Text> Possible matches for imprint: {query}</Text>
      <Text> These are possible matches, not a confirmed identification. Do not take an unknown medication. Confirm it with a pharmacist or healthcare professional.</Text>
      <Button
        title="Back to Search"
        onPress={() => router.back()}
      />
      {(() => {
        try {
          const rawMessage = Array.isArray(message) ? message[0] : message;
          const parsed = rawMessage ? JSON.parse(rawMessage) : [];
          const matches = Array.isArray(parsed) ? parsed : [];
          return (
          <>
            {matches.map((match: PillMatch) => (
              <View key={`${match.name}-${match.shape}-${match.color}-${match.imprint}`}>
                <Text>{match.name}</Text>
                <Text>{match.imprint}</Text>
                <Text>{match.shape}</Text>
                <Text>{match.color}</Text>
              </View>
            ))}
          </>
        );
        } catch (error) {
          console.error('Failed to parse message:', error);
          return null;
        }
      })()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

type PillMatch = {
  name: string;
  imprint: string;
  shape: string;
  color: string;
};

