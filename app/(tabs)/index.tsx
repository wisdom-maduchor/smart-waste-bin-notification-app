
// import { useState, useEffect, useRef } from "react";
// import { View, Text, Button, Alert, StyleSheet } from "react-native";
// import {ref, onValue} from "firebase/database";
// import { database } from "@/firebase/config";

// type BinStatus = "EMPTY" | "HALF" | "FULL";

// export default function HomeScreen() {
//   const [binStatus, setBinStatus] = useState<BinStatus>("EMPTY");
//   const hasAlerted = useRef(false);
//   const isMounted = useRef(true);

//   // 1️⃣ Firebase listener — STATE ONLY
//   useEffect(() => {
//     const binRef = ref(database, "binStatus");

//     const unsubscribe = onValue(binRef, (snapshot) => {
//       const status = snapshot.val() as BinStatus;
//       setBinStatus(status);
//     });

//     return () => unsubscribe();
//   }, []);

//   // 2️⃣ React-controlled side effect — ALERT
//   useEffect(() => {
//     if (binStatus === "FULL" && !hasAlerted.current) {
//       Alert.alert(
//         "🚨 Bin Full!",
//         "Please empty the waste bin."
//       );
//       hasAlerted.current = true;
//     }

//     if (binStatus !== "FULL") {
//       hasAlerted.current = false;
//     }
//   }, [binStatus]);

//   // const showAlert = (status: string) => {
//   //   if (status === "FULL") {
//   //     Alert.alert("🚨 Bin Full!", "Please empty the waste bin.");
//   //   }
//   // };

//   // const updateStatus = (status: "EMPTY" | "HALF" | "FULL") => {
//   //   setBinStatus(status);
//   //   showAlert(status);
//   // };

//   return (
//     // <View style={styles.container}>
//     //   <Text style={styles.title}>Smart Waste Bin</Text>
//     //   <Text style={styles.status}>Status: {binStatus}</Text>

//     //   {/* <View style={styles.buttons}>
//     //     <Button title="Set Empty" onPress={() => updateStatus("EMPTY")} />
//     //     <Button title="Set Half Full" onPress={() => updateStatus("HALF")} />
//     //     <Button title="Set Full" onPress={() => updateStatus("FULL")} />
//     //   </View> */}
//     // </View>

//      <View style={styles.container}>
//     <Text style={styles.header}>Smart Waste Bin</Text>

//     <View style={styles.card}>
//       <Text style={styles.cardTitle}>Current Status</Text>

//       <Text
//         style={[
//           styles.status,
//           binStatus === "FULL" && styles.full,
//           binStatus === "HALF" && styles.half,
//           binStatus === "EMPTY" && styles.empty,
//         ]}
//       >
//         {binStatus}
//       </Text>
//     </View>

//     <Text style={styles.footer}>
//       Live data from sensor
//     </Text>
//   </View>
//   );
// }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, justifyContent: "center", alignItems: "center" },
// //   title: { fontSize: 24, marginBottom: 20, color: '#f91818ff' },
// //   status: { fontSize: 18, marginBottom: 20, color: '#808080' },
// //   // buttons: { flexDirection: "row", gap: 10 },
// // });


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F9FAFB",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },

//   header: {
//     fontSize: 26,
//     fontWeight: "700",
//     marginBottom: 30,
//   },

//   card: {
//     width: "100%",
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 24,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },

//   cardTitle: {
//     fontSize: 16,
//     color: "#6B7280",
//     marginBottom: 10,
//   },

//   status: {
//     fontSize: 32,
//     fontWeight: "800",
//   },

//   empty: { color: "#16A34A" },
//   half: { color: "#F59E0B" },
//   full: { color: "#DC2626" },

//   footer: {
//     marginTop: 20,
//     color: "#6B7280",
//   },
// });


import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import * as Progress from "react-native-progress";
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase/config";
import { Button, Card } from "react-native-paper";
import { getAuth } from "firebase/auth";

type BinStatus = "EMPTY" | "HALF" | "FULL";


export default function HomeScreen() {
  const [binStatus, setBinStatus] = useState<BinStatus>("EMPTY");
  const [isAdmin, setIsAdmin] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const auth = getAuth();

  // 🔐 Check user role
  useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const roleRef = ref(database, `users/${user.uid}/role`);

  return onValue(roleRef, snap => {
    setIsAdmin(snap.val() === "admin");
  });
}, []);

  // 🔥 Firebase listener
  useEffect(() => {
    const binRef = ref(database, "binStatus");
    return onValue(binRef, (snapshot) => {
      setBinStatus(snapshot.val());
    });
  }, []);

  // 🔥 Pulse animation when FULL
  useEffect(() => {
    if (binStatus === "FULL") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [binStatus]);

  const getProgress = () =>
    binStatus === "EMPTY" ? 0.2 : binStatus === "HALF" ? 0.6 : 1;

  const getColor = () =>
    binStatus === "EMPTY" ? "#16A34A" : binStatus === "HALF" ? "#F59E0B" : "#DC2626";

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Smart Waste Bin</Text>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Card style={styles.card}>
          <Text style={styles.label}>Current Status</Text>

          <Text style={[styles.status, { color: getColor() }]}>
            {binStatus}
          </Text>

          <Progress.Bar
            progress={getProgress()}
            width={250}
            color={getColor()}
            style={{ marginTop: 15 }}
          />
        </Card>
      </Animated.View>

      {/* 🔐 Admin UI */}
      <Button
        mode="contained"
        style={{ marginTop: 20 }}
        onPress={() => setIsAdmin(!isAdmin)}
      >
        Switch to {isAdmin ? "User" : "Admin"}
      </Button>

      {isAdmin && (
        <Text style={styles.adminText}>Admin Controls Enabled</Text>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 30,
  },
  card: {
    padding: 30,
    borderRadius: 18,
    alignItems: "center",
  },
  label: {
    color: "#6B7280",
    marginBottom: 6,
  },
  status: {
    fontSize: 34,
    fontWeight: "900",
  },
  adminText: {
    marginTop: 10,
    color: "#2563EB",
    fontWeight: "600",
  },
});
