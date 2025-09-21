import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ImageBackground,
} from 'react-native';
import { Sun } from 'lucide-react-native';


export default function Dashboard() {

    return (
        <>
            <View style={styles.container}>

                {/* <Text></Text> */}


                <View style={styles.above}>

                    <View style={styles.cont}>
                        <Text style={{ fontSize: 22, fontWeight: "semibold", color: "white" }}>1909</Text>
                        <Text style={{ fontSize: 12, color: "white" }}>Grown</Text>

                    </View>
                    <View style={styles.circle}>
                        <Text style={styles.text}>Week</Text>
                        <Text style={styles.num}>7</Text>
                    </View>
                    <View style={styles.cont}>
                        <Text style={{ fontSize: 22, fontWeight: "semibold", color: "white" }}>1909</Text>
                        <Text style={{ fontSize: 12, color: "white" }}>Days to grow</Text>

                    </View>

                </View>

                <View style={styles.cards}>

                    <Text style={{ fontSize: 28, fontWeight: 500, color: "white", left: 25, top: 50 }}>Weight Tracker</Text>
                    <Pressable style={styles.btn}>
                        {({ pressed }) => (
                            <Text style={[styles.btnText, pressed && { opacity: 0.6 }]}>Check Now</Text>
                        )}
                    </Pressable>

                </View>

                <View style={styles.noti}>
                    <Sun color={"gold"}size={35}  ></Sun>
                    <View>

                    <Text style={styles.title}>Sunny Day</Text>
                    <Text style={styles.values}>Take in Vitamin C today!</Text>
                    </View>

                </View>
                <View style={styles.noti}>
                    <Sun color={"gold"}size={35}  ></Sun>
                    <View>

                    <Text style={styles.title}>Sunny Day</Text>
                    <Text style={styles.values}>Take in Vitamin C today!</Text>
                    </View>

                </View>
                <View style={styles.noti}>
                    <Sun color={"gold"}size={35}  ></Sun>
                    <View>

                    <Text style={styles.title}>Sunny Day</Text>
                    <Text style={styles.values}>Take in Vitamin C today!</Text>
                    </View>

                </View>

            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0cfcdff"
    },
    above: {
        height: 280,
        width: 400,
        // borderRadius:1000,
        backgroundColor: "#9A3D37",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center"
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 100, // half of width/height
        borderWidth: 2,
        borderColor: '#F4716A',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // ensures only border is visible
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F4716A',
    },
    num: {
        color: "white",
        fontSize: 45,
        fontWeight: 600
    },
    cards: {
        backgroundColor: "#715DE9",
        width: 331,
        height: 170,
        borderRadius: 15,
        left: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginTop: 18
    },
    btnText: {
        backgroundColor: "white",
        width: 240,
        borderRadius: 25,
        padding: 15,
        color: "black",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        bottom: 15,
        left: 15
    },
    noti:{
        backgroundColor:"white",
        borderColor:"black",
        borderWidth:1,
        width:300,
        padding:8,
        borderRadius:20,
        display:"flex",
        flexDirection:"row",
        gap:10,
        alignItems:"center",
        left:20,
        top:20
    },
    title:{
        fontSize:20,
        fontWeight:500
    }


})