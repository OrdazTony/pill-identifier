import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, TextInput, View, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function IdentifyScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [photoStatus, setPhotoStatus] = useState('');
  
  const pickImage = async () => { 
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) { 
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })
    if (!result.canceled && result.assets && result.assets.length > 0) { 
      setImage(result.assets[0].uri);
      setImageError('');
      setPhotoStatus('');
    }
    else {
      setImageError('Image selection was canceled.');
      setImage(null);
      setPhotoStatus('');
    }
  }

  const identifyFromPhoto = async () => { 
    if (!image) {
      setImageError('Please select an image first.');
      setPhotoStatus('Please select an image first.');
      return;
    }


    setImageError('');
    setPhotoStatus('Identifying from photo...');

    const formData = new FormData();
    formData.append('image', {
      uri: image,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any); //this apparently fixes the TypeScript error for FormData.append with a file object

    try {
      const response = await  fetch ('http://localhost:8000/ocr', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json();

      if (!response.ok) {
        setImageError(data?.error || 'Failed to identify from photo.');
        setPhotoStatus('');
        return;
      }

      const matches = JSON.stringify(data.matches);
      const statusText = data?.status || 'Image successfully uploaded.';
      const bytesText = typeof data?.bytesReceived === 'number' ? ` (${data.bytesReceived} bytes)` : '';

      router.push({ pathname: '/results', params: { message: matches, query: data.extractedText, } });

      setPhotoStatus(`${statusText}${bytesText}`);
      setImageError('');

    } catch (error) {
      console.error('Error identifying from photo:', error);
      setImageError('An error occurred while identifying from photo.');
      setPhotoStatus('');
    }
  }
  
    async function submitSearch() {
    setInlineError('');
    if (query.trim() == '') { 
        setInlineError('Please enter a valid pill imprint.');
        return;
    }
    setLoading(true);
    try { 
        const response = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(query)}`); //this needs to be updated to allow for outside network requests
        const data = await response.json();
      if (!response.ok) {
            setInlineError(data.error || 'An error occurred while fetching results.');
        } else {
        const matches = JSON.stringify(data.matches)
        const returnedQuery = data.query;
            router.push({ pathname: '/results', params: { message: matches, query: returnedQuery } },);
        }
    } catch (error) {
        setInlineError('An error occurred while fetching results. Please check your network connection and try again.');
    } finally {
        setLoading(false);
    }
}

  return (
    <View style={styles.container}>
          <Text style={styles.title}>Identify Screen</Text>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Enter imprint on pill" />
          <Button title="Search" onPress={submitSearch} />
          {inlineError ? <Text style={styles.error}>{inlineError}</Text> : null}
      {loading ? <Text>Loading...</Text> : null}

      <Button title="Pick an Image" onPress={pickImage} />
  
      <Button title="Identify from Photo" onPress={identifyFromPhoto} />
      {imageError ? <Text style={styles.error}>{imageError}</Text> : null}
      {photoStatus ? <Text style={styles.status}>{photoStatus}</Text> : null}
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    width: '80%',
  },
  error: {
    color: 'red',
  },
  status: {
    color: 'green',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});
