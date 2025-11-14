

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { Weight } from 'lucide-react-native';

const WeightTracker = () => {
  const [weight, setWeight] = useState('');
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await AsyncStorage.getItem('weight-entries');
      if (data) {
        setEntries(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const saveEntries = async (newEntries) => {
    try {
      await AsyncStorage.setItem('weight-entries', JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

  const addWeight = async () => {
    if (!weight || isNaN(weight) || parseFloat(weight) <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      weight: parseFloat(weight),
      change: 0,
    };

    const updatedEntries = [newEntry, ...entries];

    // Calculate changes
    for (let i = 0; i < updatedEntries.length - 1; i++) {
      updatedEntries[i].change =
        updatedEntries[i].weight - updatedEntries[i + 1].weight;
    }

    setEntries(updatedEntries);
    await saveEntries(updatedEntries);
    setWeight('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getChartData = () => {
    const monthlyData = {};

    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(entry.weight);
    });

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'];
    const data = months.map((month) => {
      const weights = monthlyData[month];
      return weights && weights.length > 0
        ? weights.reduce((a, b) => a + b, 0) / weights.length
        : 0;
    });

    return {
      labels: months,
      datasets: [
        {
          data: data.some(d => d > 0) ? data : [50, 55, 60, 65, 70, 75, 67, 65],
        },
      ],
    };
  };

  const displayedEntries = entries.slice(0, 3);
  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <ImageBackground source={require('../../assets/images/mother.jpg')} style={styles.image} >
          <View style={styles.overlay}>
            <Text style={styles.title}>Weight Tracker</Text>
            <View style={styles.inputContainer}>
              <TextInput placeholder='Enter new weight, kg' style={styles.input} onChangeText={setWeight} value={weight}/>
              <Pressable style={styles.btn} onPress={addWeight}>
                {({ pressed }) => (
                  <Text style={[styles.btnText, pressed && { opacity: 0.6 }]}>Add</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.filterContainer}>
          <Text style={styles.filterText}>June</Text>
          <TouchableOpacity>
            <Text style={styles.filterIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {entries.length > 0 ? (
          <>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.weightColumn]}>Weight</Text>
                <Text style={[styles.tableHeaderText, styles.changeColumn]}>Change</Text>
              </View>

              {displayedEntries.map((entry, index) => (
                <View key={entry.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.dateColumn]}>
                    {formatDate(entry.date)}
                  </Text>
                  <Text style={[styles.tableCell, styles.weightColumn]}>
                    {entry.weight} kg
                  </Text>
                  <Text style={[styles.tableCell, styles.changeColumn]}>
                    {index === displayedEntries.length - 1
                      ? ''
                      : `${Math.abs(entry.change).toFixed(1)} kg`}
                  </Text>
                </View>
              ))}
            </View>

            {entries.length > 3 && (
              <TouchableOpacity style={styles.seeMoreButton}>
                <Text style={styles.seeMoreText}>See More</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No weight entries yet</Text>
            <Text style={styles.emptySubtext}>Add your first weight above</Text>
          </View>
        )}

        <View style={styles.chartContainer}>
          <LineChart
            data={getChartData()}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 139, 148, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#FF8B94',
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WeightTracker;

const styles = StyleSheet.create({
  containers: {
    flex: 1,
    backgroundColor: "#FFBFBC"
  },
  image: {
    // flex: 1,
    height: 250,
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
    top: 40,
    right: 50
  },
  inputContainer: {
    flexDirection: 'row',
    top: 50,
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
    width: 80,
    borderRadius: 25,
    padding: 15,
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center"
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    fontSize: 28,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#FF8B94',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterText: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  filterIcon: {
    fontSize: 20,
    color: '#666',
  },
  table: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF8B94',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  tableHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    fontSize: 16,
    color: '#333',
  },
  dateColumn: {
    flex: 2,
  },
  weightColumn: {
    flex: 2,
    textAlign: 'center',
  },
  changeColumn: {
    flex: 2,
    textAlign: 'right',
  },
  seeMoreButton: {
    alignSelf: 'center',
    backgroundColor: '#FF8B94',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginBottom: 30,
  },
  seeMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});