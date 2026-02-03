import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function SubjectLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
