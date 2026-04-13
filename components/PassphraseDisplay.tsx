import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

interface Props {
  passphrase: string;
}

export function PassphraseDisplay({ passphrase }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(passphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 gap-3">
      <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
        Your Secret Passphrase
      </Text>
      <Text
        className="font-mono text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed"
        selectable
      >
        {passphrase}
      </Text>
      <TouchableOpacity
        onPress={handleCopy}
        className="bg-indigo-600 rounded-lg py-2 px-4 items-center self-start"
        activeOpacity={0.8}
      >
        <Text className="text-white text-sm font-semibold">
          {copied ? "Copied!" : "Copy Passphrase"}
        </Text>
      </TouchableOpacity>
      <Text className="text-xs text-indigo-500 dark:text-indigo-400 leading-relaxed">
        Save this somewhere safe. Anyone with this passphrase can access your
        account — there is no password reset.
      </Text>
    </View>
  );
}
