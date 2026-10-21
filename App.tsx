import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import StudentScreen from './src/features/student/StudentScreen';

const Stack = createNativeStackNavigator();

// Halaman Pemilihan Role (Bisa dikembangkan kelompok, atau langsung tombol ke fitur Anda)
function RoleSelectScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PPK Mobile</Text>
      <Text style={styles.subtitle}>Pilih role untuk mulai demo.</Text>

      {/* Tombol pintasan langsung ke Alur Praktikan */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('StudentFlow')}
      >
        <Text style={styles.buttonText}>Masuk sebagai Praktikan</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelect">
        <Stack.Screen
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{ title: 'PPK Mobile - Pilih Peran' }}
        />
        <Stack.Screen
          name="StudentFlow"
          component={StudentScreen}
          options={{ title: 'Portal Praktikan', headerShown: false }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});