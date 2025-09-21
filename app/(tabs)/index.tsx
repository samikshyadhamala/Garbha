import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Text, TouchableOpacity, Dimensions, Linking, SafeAreaView } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
   <>

   <View style={styles.container}>
    <Image source={require('../../assets/images/react-logo.png')} style={{ width: 200, height: 200 }}  ></Image>
    <View style={styles.cont}>


    <Text style={styles.title}>गर्भ</Text>
    <Text style={styles.para}>Guiding Mothers, Nurturing Futures.</Text>
    </View>



   </View>

   </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:"#FFBFBC",
    flex: 1,
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center"


  },
  title :{
    fontSize:60,
    fontWeight:800,
    color:"#CD2020"

  },
  para:{
    fontSize:16,
    color:"#B55045"
  },
  cont:{
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    marginTop:20

  }
});
