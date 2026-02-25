/**
 * SkeletonLoader
 * Moti-powered pulsing skeletons for list rows and cards.
 */

import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';

type SkeletonBoxProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
};

function SkeletonBox({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonBoxProps) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
      style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB' }, style]}
    />
  );
}

function StudentRowSkeleton() {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <SkeletonBox width={160} height={16} />
        <SkeletonBox width={90} height={12} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={72} height={28} borderRadius={14} />
    </View>
  );
}

function SessionCardSkeleton() {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionCardTop}>
        <SkeletonBox width={140} height={16} />
        <SkeletonBox width={50} height={22} borderRadius={11} />
      </View>
      <SkeletonBox width={80} height={12} style={{ marginTop: 8 }} />
      <View style={styles.sessionCardBottom}>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={90} height={32} borderRadius={8} />
      </View>
    </View>
  );
}

export function StudentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <StudentRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function SessionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: 2 }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  rowLeft: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  sessionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});
