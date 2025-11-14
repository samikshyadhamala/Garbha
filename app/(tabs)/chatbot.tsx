
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { File, ArrowRight, History, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Use environment variables for API keys
const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;


const HistoryDrawer = ({ isOpen, onClose }) => {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withSpring(isOpen ? 0 : -width, { damping: 100 });
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View style={[styles.drawer, animatedStyle]}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <X size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.drawerHeader}>History</Text>
      <FlatList
        data={['Conversation 1', 'Conversation 2', 'Conversation 3']}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.historyItem}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.newChatButton}>
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot' },
  ]);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // Handle case where token is not available
        return;
      }
      const response = await fetch("https://garbha.onrender.com/api/auth/pregnancy-profile", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setContext(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectFile = async () => {
    console.log("I am inside the select file before try")
    try {
      console.log("I am inside the select file")

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setSelectedFile({ ...file, base64 });
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick a document.');
    }
  };



  const handleImageSend = async () => {
    if (selectedFile && selectedFile.base64) {
      console.log("I am inside the handle image")
      try {
        const body = {
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Pull out the content of the image or say what is it." },
                {
                  type: "image_url",
                  image_url: { url: `data:${selectedFile.mimeType};base64,${selectedFile.base64}` }
                }
              ]
            },
          ]
        };
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        return { "content": data.choices[0].message.content, "image": true };
      } catch (err) {
        Alert.alert("There was a problem processing the image.");
        return null;
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) {
      return;
    }

    const userMessageText = input;
    const userMessage = { id: Date.now(), text: userMessageText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    let query = userMessageText;
    let imageContent = null;

    if (selectedFile) {
      imageContent = await handleImageSend();
      if (imageContent) {
        query = `You have been provided with the image description retrieved from the llm, so based on the image describe suggest user what they ask:

        #Image Description
        ${imageContent.content}

        #User Query
        ${userMessageText}
        `;
      }
      setSelectedFile(null);
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('https://garbha-1.onrender.com/run-agent', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          context: context,
          filters: { active: true }
        })
      });
      const resp = await response.json();
      const botMessage = { id: Date.now(), text: resp["agent_result"], sender: "bot" };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.log("this is an error:", error);
      const errorMessage = { id: Date.now(), text: "Sorry, something went wrong.", sender: "bot" };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Markdown style={markdownStyles}>{item.text}</Markdown>
      {/* <Text style={styles.messageText}>{item.text}</Text> */}
      
      {item.file && (
        <Image source={{ uri: item.file.uri }} style={styles.messageImage} />
      )}
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <HistoryDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
        <View style={styles.containers}>
          <View style={styles.header}>
            <Pressable onPress={() => setDrawerOpen(true)}>
              <History size={20} />
            </Pressable>
            <Text style={styles.head}>Your pregnancy companion</Text>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.chatContainer}
          />



          <View style={styles.bottom}>
            <View style={styles.inputRow}>
              <Pressable onPress={selectFile}>
                <File color="red" size={25} />
              </Pressable>

              {selectedFile && (
                <View style={styles.fileInfo}>
                  <Feather name={selectedFile.mimeType?.startsWith('image/') ? 'image' : 'file-text'} size={24} color="#555" />
                  <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                  <Pressable onPress={() => setSelectedFile(null)} style={styles.clearFileButton}>
                    <X size={16} color="white" />
                  </Pressable>
                </View>
              )}

              <TextInput
                style={styles.search}
                placeholder="How can I help you?"
                multiline
                value={input}
                onChangeText={setInput}
              />
            </View>

            <Pressable onPress={handleSend}>
              {({ pressed }) => (
                <ArrowRight
                  color="black"
                  size={29}
                  style={[
                    styles.sendIcon,
                    pressed && { opacity: 0.6 },
                  ]}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  containers: {
    flex: 1,
    backgroundColor: '#FFBFBC',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 15,
    gap: 20,
    marginHorizontal: 10,
  },
  head: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    margin: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  search: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    textAlignVertical: 'top',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
    paddingHorizontal: 8,
  },
  fileName: {
    fontSize: 14,
    marginLeft: 5,
    maxWidth: 100,
  },
  clearFileButton: {
    marginLeft: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  sendIcon: {
    backgroundColor: '#F4716A',
    borderRadius: 12,
    padding: 18,
  },
  chatContainer: {
    flexGrow: 1,
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: 'white',
    zIndex: 100,
    padding: 20,
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  drawerHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  historyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  newChatButton: {
    marginTop: 'auto',
    padding: 15,
    backgroundColor: '#F4716A',
    borderRadius: 10,
    alignItems: 'center',
  },
  newChatText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

const markdownStyles = {                                                                                  
      body: {                                                                                                  
       textAlign: 'left',                                                                                      
}                                                                                                      
   };  
