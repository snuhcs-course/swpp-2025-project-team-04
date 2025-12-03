import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseModal from './BaseModal';

type AlertModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

export default function AlertModal({
  visible,
  title = '알림',
  message = '',
  confirmText = '확인',
  cancelText = '취소',
  onClose,
  onConfirm,
}: AlertModalProps) {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      {/* 헤더: 아이콘 + 타이틀 */}
      <View className="flex-row items-center">
        <View className="mr-3 rounded-full bg-sky-100 p-2">
          <Ionicons name="warning-outline" size={20} color="#f97316" />
        </View>
        <Text className="text-lg font-bold text-slate-900">{title}</Text>
      </View>

      {/* 내용 */}
      {message ? <Text className="mt-3 text-slate-600">{message}</Text> : null}

      {/* 버튼 영역 */}
      <View className="mt-5 flex-row justify-end gap-2">
        <Pressable
          onPress={handleCancel}
          className="rounded-xl bg-slate-100 px-4 py-2"
        >
          <Text className="font-semibold text-slate-600">{cancelText}</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          className="rounded-xl bg-rose-500 px-4 py-2"
        >
          <Text className="font-semibold text-white">{confirmText}</Text>
        </Pressable>
      </View>
    </BaseModal>
  );
}
