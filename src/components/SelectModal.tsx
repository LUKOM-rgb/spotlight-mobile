import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface SelectOption<T extends string | number = string> {
  label: string;
  value: T;
  subtitle?: string;
}

interface SelectModalProps<T extends string | number> {
  label?: string;
  placeholder?: string;
  options: SelectOption<T>[];
  selectedValue: T | null | undefined;
  onSelect: (value: T) => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function SelectModal<T extends string | number>({
  label,
  placeholder = 'Selecionar...',
  options,
  selectedValue,
  onSelect,
  iconName = 'chevron-down-outline',
}: SelectModalProps<T>) {
  const { palette } = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      ) : null}

      <Pressable
        onPress={() => setVisible(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: palette.inputBg,
            borderColor: palette.border,
          },
        ]}
      >
        <Text
          style={{
            color: selectedOption ? palette.text : palette.textMuted,
            fontSize: 14,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name={iconName} size={18} color={palette.primary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHeader, { borderBottomColor: palette.border }]}>
              <Text style={[styles.sheetTitle, { color: palette.text }]}>
                {label || placeholder}
              </Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={22} color={palette.textMuted} />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item.value);
                      setVisible(false);
                    }}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected ? palette.accentSoft : 'transparent',
                        borderBottomColor: palette.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? palette.primary : palette.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={[styles.optionSub, { color: palette.textMuted }]}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={palette.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: palette.textMuted }]}>
                  Sem opções disponíveis.
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: {
    fontSize: 15,
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
});
