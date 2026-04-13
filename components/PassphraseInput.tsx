import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function PassphraseInput({
  value,
  onChangeText,
  placeholder = "word1-word2-word3-...",
  editable = true,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 gap-2">
      <TextInput
        className="flex-1 font-mono text-sm text-gray-900 dark:text-gray-100"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        editable={editable}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {visible ? (
          <EyeOff size={18} color="#6b7280" />
        ) : (
          <Eye size={18} color="#6b7280" />
        )}
      </TouchableOpacity>
    </View>
  );
}
