/**
 * AtRiskCallout — amber/red card shown only when a student is flagged at-risk.
 * Shows the flagged reason and actions (message parent, add note).
 */

import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type AtRiskCalloutProps = {
  triggers: string[];
  parentPhone?: string;
  parentName?: string;
  onAddNote: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

export function AtRiskCallout({ triggers, parentPhone, parentName, onAddNote, t }: AtRiskCalloutProps) {
  const c = colors.semantic;

  const handleMessageParent = async () => {
    if (!parentPhone)
      return;
    const text = encodeURIComponent(
      t('manager.studentDetail.waGreeting', { name: parentName ?? '', defaultValue: `Hello ${parentName ?? ''},` }),
    );
    const phone = parentPhone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${text}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen)
      await Linking.openURL(url);
  };

  return (
    <View
      className="mx-4 mb-4 flex-row items-start gap-3 rounded-r3 p-3.5"
      style={{ backgroundColor: c.absentSoft, borderWidth: 1.5, borderColor: `${c.absent}40` }}
    >
      {/* Icon tile */}
      <View className="size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: c.absent }}>
        <Ionicons name="flag" size={18} color="#fff" />
      </View>

      <View className="flex-1">
        <Text style={{ fontSize: 13, fontWeight: '800', color: c.absentInk, letterSpacing: -0.2 }}>
          {t('manager.studentDetail.atRiskTitle', { defaultValue: 'Why this student is flagged' })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {triggers.map(trigger => (
            <View key={trigger} style={{ backgroundColor: `${c.absent}25`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.absentInk }}>{trigger}</Text>
            </View>
          ))}
        </View>

        <View className="mt-2.5 flex-row gap-2">
          {parentPhone
            ? (
                <Pressable
                  onPress={handleMessageParent}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{ backgroundColor: c.absent }}
                >
                  <Ionicons name="logo-whatsapp" size={12} color="#fff" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                    {t('manager.studentDetail.messageParent', { defaultValue: 'Message parent' })}
                  </Text>
                </Pressable>
              )
            : null}
          <Pressable
            onPress={onAddNote}
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: `${c.absent}40` }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: c.absentInk }}>
              {t('manager.studentDetail.addNote', { defaultValue: 'Add note' })}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
