import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';



export default function ResultScreen() {
  const { message, query } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Result Screen</Text>
      <Text> Possible matches for imprint: {query}</Text>
      <Text style={styles.disclaimer}> These are possible matches, not a confirmed identification. Do not take an unknown medication. Confirm it with a pharmacist or healthcare professional.</Text>
      <Button 
        title="Back to Search"
        onPress={() => router.back()}
      />
      {(() => {
        try {
          const rawMessage = Array.isArray(message) ? message[0] : message;
          const parsed = rawMessage ? JSON.parse(rawMessage) : [];
          const matches = Array.isArray(parsed) ? parsed : [];
          return matches.length === 0 ? (
            <Text style={styles.emptyState}> No possible matches were  found.</Text>
          ):(
          <>
            {matches.map((match: PillMatch) => (
              <View key={`${match.name}-${match.shape}-${match.color}-${match.imprint}`} style={styles.matchContainer}>
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
  matchContainer: {
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 16,
    marginTop: 16,
    fontStyle: 'italic',
    color: '#655b5b',
  },
  emptyState: {
    marginTop: 16,
    textAlign: 'center',
    color: '#555',
  },
});

type PillMatch = {
  name: string;
  imprint: string;
  shape: string;
  color: string;
};



