import React from 'react';
import { Modal, Pressable, View } from 'react-native';

type BaseModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
};

export default function BaseModal({
  visible,
  onClose,
  children,
}: BaseModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose} // 안드로이드 뒤로가기 대응
    >
      {/* 전체 오버레이 */}
      <View className="flex-1 items-center justify-center bg-black/40">
        {/* 오버레이 눌렀을 때 닫기 */}
        <Pressable className="absolute inset-0" onPress={onClose} />

        {/* 모달 내용 */}
        <View className="w-80 rounded-2xl bg-white p-5">{children}</View>
      </View>
    </Modal>
  );
}
