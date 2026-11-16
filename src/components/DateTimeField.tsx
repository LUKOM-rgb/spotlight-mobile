import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatIsoDate, formatTimeHm } from '../utils/formatters';

interface DateTimeFieldProps {
  label: string;
  mode: 'date' | 'time';
  value: string;
  onChange: (formatted: string) => void;
  placeholder?: string;
}

function parseDateValue(mode: 'date' | 'time', value: string): Date {
  const now = new Date();
  if (!value) return now;

  if (mode === 'date') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  } else {
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (match) {
      const copy = new Date(now);
      copy.setHours(Number(match[1]), Number(match[2]), 0, 0);
      return copy;
    }
  }
  return now;
}

export function DateTimeField({ label, mode, value, onChange, placeholder }: DateTimeFieldProps) {
  const { palette } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const dateObj = useMemo(() => parseDateValue(mode, value), [mode, value]);

  const handleNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    onChange(mode === 'date' ? formatIsoDate(selected) : formatTimeHm(selected));
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? (mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM')}
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: palette.inputBg,
            borderColor: palette.border,
          },
        ]}
      >
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={18}
          color={palette.primary}
        />
        <Text style={{ color: value ? palette.text : palette.textMuted, fontSize: 14, flex: 1 }}>
          {value || placeholder || (mode === 'date' ? 'Selecionar data' : 'Selecionar hora')}
        </Text>
      </Pressable>

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={dateObj}
          mode={mode}
          is24Hour
          display="default"
          onChange={handleNativeChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)}>
            <Pressable
              style={[styles.modalCard, { backgroundColor: palette.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: palette.text }]}>{label}</Text>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 15 }}>
                    Concluir
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dateObj}
                mode={mode}
                is24Hour
                display="spinner"
                themeVariant={palette.isDark ? 'dark' : 'light'}
                onChange={handleNativeChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
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
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
});
