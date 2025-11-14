import { useRouter } from 'expo-router';
// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function KickCounter1() {
  const router = useRouter();
  // state: total kicks for quick display (optional) and journal entries
  const [totalKicks, setTotalKicks] = useState(0);
  const [journal, setJournal] = useState([]);
  // we keep a session start time to optionally compute duration per entry (first kick -> last kick)
  const [sessionStart, setSessionStart] = useState(null);

  // helper to format date/time
  const formatDateTime = (d) => {
    const dt = new Date(d);
    return dt.toLocaleString(); // you can change format if needed
  };

  // called when the circle is pressed (register a kick)
  const handleKick = () => {
    const now = new Date();
    // update total counter
    setTotalKicks(prev => prev + 1);

    // if no sessionStart set, set it now
    setSessionStart(prev => prev ?? now);

    // create or update today's journal entry (group by date - yyyy-mm-dd)
    const key = now.toISOString().slice(0, 10); // date key e.g. "2025-11-14"
    setJournal(prev => {
      const last = prev.length ? prev[0] : null; // keeping newest first
      if (last && last.dateKey === key) {
        // update existing today's entry: increment kicks and update lastTime and duration
        const updated = {
          ...last,
          kicks: last.kicks + 1,
          lastTime: now.toISOString(),
          durationMinutes: Math.round((new Date(now) - new Date(last.firstTime)) / 60000)
        };
        return [updated, ...prev.slice(1)];
      } else {
        // new entry for today
        const entry = {
          id: now.getTime().toString(),
          dateKey: key,
          displayDate: formatDateTime(now),
          firstTime: now.toISOString(),
          lastTime: now.toISOString(),
          kicks: 1,
          durationMinutes: 0,
        };
        return [entry, ...prev];
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Kick Counter</Text>

      {/* Circle with Image */}
      <View style={styles.circleContainer}>
        {/* <View style={styles.circle}>
          <Image
            source={{uri: 'https://cdn-icons-png.flaticon.com/512/3159/3159517.png'}}
            style={styles.icon}
            resizeMode="contain"
          />
        </View> */}
        <TouchableOpacity style={styles.circle} onPress={handleKick} activeOpacity={0.7}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3159/3159517.png' }}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 5 }}>+</Text>
        </TouchableOpacity>
        <Text style={styles.instruction}>
          Press the button to start counting kicks
        </Text>
      </View>

      {/* Journal section */}
      <View style={styles.journalSection}>
        <Text style={styles.journalTitle}>Journal</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Date and time</Text>
          <Text style={styles.headerText}>Duration</Text>
          <Text style={styles.headerText}>Kicks</Text>
        </View>
        {journal.length === 0 ? (
          <Text style={{ color: '#666', marginTop: 12 }}>No kicks yet — tap the circle to log one.</Text>
        ) : (
          journal.map((entry) => (
            <View key={entry.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 12 }}>
              <Text style={{ flex: 1 }}>{entry.displayDate}</Text>
              <Text style={{ width: 70, textAlign: 'center' }}>{entry.durationMinutes}m</Text>
              <Text style={{ width: 50, textAlign: 'right' }}>{entry.kicks}</Text>
            </View>
          ))
        )}
      </View>
      

      {/* Start Button */}
      {/* <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/kickcounter2')}
      >
        <Text style={styles.startText}>Start Counting</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EFFF',
    padding: 20,
  },
  title: {
    marginTop: 40,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },
  circleContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  circle: {
    width: 150,
    height: 150,
    backgroundColor: '#C084FC',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    width: 70,
    height: 70,
    tintColor: 'white',
    resizeMode: 'contain',
  },
  instruction: {
    marginTop: 20,
    fontSize: 14,
    color: '#777',
  },
  journalSection: {
    marginTop: 80,
  },
  journalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  headerText: {
    color: '#888',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#A855F7',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 40,
    alignSelf: 'center',
    width: '80%',
  },
  startText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
