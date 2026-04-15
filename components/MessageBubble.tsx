import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import type { Message } from "@/lib/types";
import { formatTime } from "@/lib/date";
import { Pencil, Trash2 } from "lucide-react-native";

interface Props {
  message: Message;
  isSelf: boolean;
  showSenderName: boolean;
  onEdit?: (newText: string) => void;
  onDelete?: () => void;
}

function EditModal({
  visible,
  initialText,
  onSave,
  onClose,
}: {
  visible: boolean;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialText);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">Edit Message</Text>
          </View>
          <View className="p-4 gap-3">
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 dark:text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const trimmed = text.trim();
                  if (trimmed) onSave(trimmed);
                  onClose();
                }}
                className="flex-1 bg-indigo-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function MessageBubble({ message, isSelf, showSenderName, onEdit, onDelete }: Props) {
  const [editModalVisible, setEditModalVisible] = useState(false);

  if (message.deleted) {
    return (
      <View className={`flex-row mb-1 px-4 ${isSelf ? "justify-end" : "justify-start"}`}>
        <Text className="text-xs italic text-gray-400 dark:text-gray-600">
          Message deleted
        </Text>
      </View>
    );
  }

  function handleLongPress() {
    if (!isSelf || (!onEdit && !onDelete)) return;

    const buttons: Array<{ text: string; style?: "default" | "destructive" | "cancel"; onPress?: () => void }> = [];

    if (onEdit) {
      buttons.push({
        text: "Edit",
        onPress: () => setEditModalVisible(true),
      });
    }
    if (onDelete) {
      buttons.push({
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (Platform.OS === "web") {
            if (window.confirm("Delete this message?")) onDelete();
          } else {
            Alert.alert("Delete Message", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: onDelete },
            ]);
          }
        },
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });

    if (Platform.OS === "web") {
      // Web: show a simple inline option (no native Alert on web)
      setEditModalVisible(true);
    } else {
      Alert.alert("Message", "", buttons);
    }
  }

  return (
    <>
      <TouchableOpacity
        onLongPress={isSelf && (onEdit || onDelete) ? handleLongPress : undefined}
        activeOpacity={0.85}
        className={`flex-row mb-1 px-4 ${isSelf ? "justify-end" : "justify-start"}`}
      >
        <View
          style={{ maxWidth: "75%" }}
          className={`rounded-2xl px-3.5 py-2.5 gap-1 ${
            isSelf
              ? "bg-indigo-600 rounded-tr-sm"
              : "bg-gray-100 dark:bg-gray-800 rounded-tl-sm"
          }`}
        >
          {showSenderName && !isSelf && (
            <Text className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">
              {message.senderName}
            </Text>
          )}
          <Text
            className={`text-sm leading-relaxed ${
              isSelf ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {message.text}
          </Text>
          <View className="flex-row items-center justify-end gap-1.5">
            {message.editedAt && (
              <Pencil size={10} color={isSelf ? "#a5b4fc" : "#9ca3af"} />
            )}
            <Text
              className={`text-xs ${
                isSelf ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {onEdit && (
        <EditModal
          visible={editModalVisible}
          initialText={message.text}
          onSave={onEdit}
          onClose={() => setEditModalVisible(false)}
        />
      )}
    </>
  );
}
