import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Send } from "lucide-react-native";

interface Props {
  onSend(text: string): void;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled = false }: Props) {
  const [text, setText] = useState("");

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <View className="flex-row items-end px-3 py-2 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 gap-2">
      <TextInput
        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 text-gray-900 dark:text-white text-base min-h-[40px] max-h-[120px]"
        value={text}
        onChangeText={setText}
        placeholder="Message…"
        placeholderTextColor="#9ca3af"
        multiline
        returnKeyType="default"
        editable={!disabled}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          text.trim() && !disabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-800"
        }`}
        activeOpacity={0.8}
      >
        <Send
          size={18}
          color={text.trim() && !disabled ? "white" : "#9ca3af"}
        />
      </TouchableOpacity>
    </View>
  );
}
