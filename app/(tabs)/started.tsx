import React,{ useState } from 'react'
import { Image } from 'expo-image';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Dimensions, Linking, Pressable } from 'react-native';
import Checkbox from 'expo-checkbox';

export default function GetStarted() {
      const [isChecked, setChecked] = useState(false);
    return (
        <>
            <View style={styles.containers}>
                <View style={styles.above}>

                    <Image source={require('../../assets/images/react-logo.png')} style={{ width: 200, height: 200 }}  ></Image>
                    <View style={styles.cont}>


                        <Text style={styles.title}>Get Started</Text>
                        <Text style={styles.para}>Create account for free.</Text>
                    </View>
                </View>
                <View style={styles.below}>

                    <TextInput style={styles.input} placeholder="Full name" />
                    <TextInput style={styles.input} placeholder="Phone Number" />



                </View>
                <View style={styles.buttons}>
                    <View style={{display:"flex", flexDirection:"row",justifyContent:"center"}}>

                    <Checkbox
                    value={isChecked}
                    onValueChange={setChecked}
                    color={isChecked ? '#4630EB' : undefined}
                    style={{left:20}}
                    />
                    <Text style={{fontSize:12, textAlign:"center"}}>By checking the box you agree to our <Text style={styles.highlight}>Terms and Conditions</Text>.</Text>
                    </View>

                    <Pressable style={styles.btn}>
          {({pressed}) => (
            <Text style={[{ backgroundColor:"#F4716A", borderRadius:12, padding:15, marginVertical:20, color:"white", fontSize:22, fontWeight:"bold", textAlign:"center"}, pressed && {opacity: 0.6}]}>Next ➡</Text>
          )}
        </Pressable>


                </View>

            </View>
        </>
    )
}

const styles = StyleSheet.create({
    containers: {
        backgroundColor: "white",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap:30,
        // justifyContent: "center",
        // alignItems: "center"

    },
    title: {
        fontSize: 36,
        fontWeight: 800,
        color: "#F4716A"

    },
    para: {
        fontSize: 14
    },
    cont: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 10

    },
    input: {
        padding: 15,
        backgroundColor:"#C4C4C4",
        margin:10,
        borderRadius:10,

    },
    below: {

    },
    buttons: {
        bottom:-50,
        margin:10,
        display:"flex",
        flexDirection:"column",
        // alignItems:"center"

    },
    above: {
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        marginTop:40,
        // justifyContent:"space-evenly",
        // top:40


    },
    btn:{
        
    },
    highlight:{
        color:"red"
    }
})
