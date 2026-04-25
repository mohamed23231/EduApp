import { Redirect } from 'expo-router';

export default function ParentIndexRoute() {
  return <Redirect href="/(parent)/(tabs)/dashboard" />;
}
