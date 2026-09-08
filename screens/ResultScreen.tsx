import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, Button } from 'react-native';



export default function ResultScreen() {
  const { message, query } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Result Screen</Text>
      <Text> Possible matches for imprint: {query}</Text>
      <Button
        title="Back to Search"
        onPress={() => router.back()}
      />
      {(() => {

        const rawMessage = Array.isArray(message) ? message[0] : message;
        const matches = rawMessage ? JSON.parse(rawMessage) : [];
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
    
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

