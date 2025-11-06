import React, { useState, useEffect } from 'react';
// import { api_key } from '@env'
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
} from 'react-native';
import { File, ArrowRight, History, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// const dummyMessages = [
//   { id: '1', text: 'Hello! How can I help you today?', sender: 'bot' },
//   { id: '2', text: 'I have a question about my pregnancy.', sender: 'user' },
//   { id: '3', text: 'Of course, ask away!', sender: 'bot' },
// ];

const { width } = Dimensions.get('window');

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
    {id:1, text: 'Hello! How can I help you today?', sender: 'bot' },

  ]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState('')
  const api_key = "hello"

   const handleSend = async ()=>{

    setMessages(prev => [...prev,{id : prev.length+1, text: input, sender: 'user' }]);
    setInput('');
    

    try{


    const response = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:"POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${api_key}`, 
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            "role":"system",
            "content":"You are an ai assistant."
          },
          {
            "role": "user",
            "content": input
          }
        ],
      })
    })

    const resp = await response.json()
    setMessages(prev => [...prev,{id : prev.length+1, text: resp.choices[0].message.content ,sender:"bot"}])
      }catch(err){
        console.log(err)

      }

  }

  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({});
      console.log(res);
    } catch (err) {
      console.log('Unknown error: ', err);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
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
                  <History size={20}/>
              </Pressable>
              <Text style={styles.head}>Your pregnancy companion</Text>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatContainer}
          />

          <View style={styles.bottom}>
            <View style={styles.inputRow}>
              <Pressable onPress={handleFileUpload}>
                <File color="red" size={25} />
              </Pressable>

              <TextInput
                style={styles.search}
                placeholder="How can I help you?"
                multiline
                value={input}
                onChange={(e)=> setInput(e.nativeEvent.text)} />
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
        paddingTop: 60, // Add padding to avoid overlap
      },
      header: {
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'flex-start',
        backgroundColor:'white',
        padding:10,
        borderRadius:15,
        gap:20,
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
