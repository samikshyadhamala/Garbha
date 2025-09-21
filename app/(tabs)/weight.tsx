import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ImageBackground,
} from 'react-native';

export default function Weight() {
    return (
        <View style={styles.containers}>
            <ImageBackground source={require('../../assets/images/mother.jpg')} style={styles.image}>
                <View style={styles.overlay}>
                    <Text style={styles.title}>Weight Tracker</Text>
                    <View style={styles.inputContainer}>
                        <TextInput placeholder='Enter new weight, kg' style={styles.input} />
                        <Pressable style={styles.btn}>
                            {({ pressed }) => (
                                <Text style={[styles.btnText, pressed && { opacity: 0.6 }]}>Add</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    containers: {
        flex: 1,
        backgroundColor: "#FFBFBC"
    },
    image: {
        // flex: 1,
        height:300,
        resizeMode: "cover",
        justifyContent: "center"
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: '500',
        color: 'white',
        marginBottom: 20,
        top:40,
        right:50
    },
    inputContainer: {
        flexDirection: 'row',
        top:50,
        // backgroundColor:"#FEF3F3"
        // alignItems: 'flex-end',
        
    },
    input: {
        backgroundColor: "#FEF3F3",
        padding: 10,
        borderRadius: 25,
        width: 260,

    },
    btn: {
        marginLeft: 10,
    },
    btnText: {
        backgroundColor: "#F4716A",
        width:80,
        borderRadius: 25,
        padding: 15,
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center"
    }
});
