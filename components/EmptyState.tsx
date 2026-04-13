import React from "react";
import { View, Text } from "react-native";
import { MessageCircle } from "lucide-react-native";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <View className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950 rounded-full items-center justify-center">
        {icon ?? <MessageCircle size={36} color="#6366f1" />}
      </View>
      <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
        {title}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
        {description}
      </Text>
    </View>
  );
}
