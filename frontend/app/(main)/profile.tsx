import type { ApiError } from '@/api/client';
import {
  useDeleteAccount,
  useLogout,
} from '@/hooks/mutations/useAuthMutations';
import { useUser } from '@/hooks/queries/useUserQueries';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

// 비밀번호 관련 타입 제거함
type ModalType =
  | 'privacy'
  | 'help'
  | 'about'
  | 'confirmLogout'
  | 'confirmDelete';

const infoModalCopy: Record<
  Extract<ModalType, 'privacy' | 'help' | 'about'>,
  { title: string; body: string[] }
> = {
  privacy: {
    title: '개인정보 보호',
    body: [
      'LingoFit은 서비스 제공에 꼭 필요한 정보만 수집하며, 모든 유저 데이터를 안전하게 보관하고 있습니다.',
    ],
  },
  help: {
    title: '도움말 및 지원',
    body: [
      '사용 중 궁금한 점이나 문제가 발생하면 언제든 step215@snu.ac.kr 으로 문의해주세요.',
      '버그 제보나 기능 개선 제안 등 모든 피드백을 환영합니다. 여러분의 의견이 LingoFit을 더 나은 서비스로 만듭니다.',
    ],
  },
  about: {
    title: 'LingoFit 소개',
    body: [
      'LingoFit은 AI 기반 맞춤형 영어 리스닝 학습 애플리케이션으로, 사용자의 수준과 관심사에 맞춘 오디오 콘텐츠를 제공합니다.',
      '매일 짧은 시간 동안 부담 없이 들으며 청취 이해력을 향상시키는 것을 목표로 하고 있습니다.',
    ],
  },
};

type ProfileModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryVariant?: 'default' | 'danger';
  isPrimaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  isSecondaryDisabled?: boolean;
  disableBackdropClose?: boolean;
  children?: ReactNode;
};

const ProfileModal = ({
  visible,
  title,
  description,
  onClose,
  primaryLabel,
  onPrimary,
  primaryVariant = 'default',
  isPrimaryLoading = false,
  secondaryLabel,
  onSecondary,
  isSecondaryDisabled = false,
  disableBackdropClose = false,
  children,
}: ProfileModalProps) => {
  const primaryButtonClass =
    primaryVariant === 'danger'
      ? 'bg-red-500 active:bg-red-600'
      : 'bg-primary active:bg-primary/90';

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-8"
        onPress={() => {
          if (!disableBackdropClose && !isPrimaryLoading) {
            onClose();
          }
        }}
      >
        <Pressable
          className="w-full rounded-3xl bg-white p-6 shadow-2xl"
          style={{ maxWidth: 420 }}
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="text-center text-2xl font-black text-neutral-900">
            {title}
          </Text>
          {description ? (
            <Text className="mt-3 text-center text-sm text-neutral-600">
              {description}
            </Text>
          ) : null}
          {children ? <View className="mt-4">{children}</View> : null}
          <View className="mt-6">
            {primaryLabel && onPrimary ? (
              <Pressable
                className={`rounded-2xl py-4 ${primaryButtonClass} ${
                  isPrimaryLoading ? 'opacity-80' : ''
                }`}
                onPress={onPrimary}
                disabled={isPrimaryLoading}
              >
                {isPrimaryLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-center text-base font-bold text-white">
                    {primaryLabel}
                  </Text>
                )}
              </Pressable>
            ) : null}
            {secondaryLabel && onSecondary ? (
              <Pressable
                className={`mt-3 rounded-2xl border border-neutral-200 py-4 active:bg-neutral-100 ${
                  isSecondaryDisabled ? 'opacity-60' : ''
                }`}
                onPress={onSecondary}
                disabled={isSecondaryDisabled}
              >
                <Text className="text-center text-base font-semibold text-neutral-700">
                  {secondaryLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

type ActionRowProps = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  className?: string;
};

const ActionRow = ({
  iconName,
  title,
  description,
  onPress,
  variant = 'default',
  disabled = false,
  className = '',
}: ActionRowProps) => {
  const iconColor = variant === 'danger' ? '#b91c1c' : '#0ea5e9';
  const badgeBg = variant === 'danger' ? 'bg-red-100' : 'bg-primary/10';
  const textColor = variant === 'danger' ? 'text-red-600' : 'text-neutral-900';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm active:bg-neutral-50 ${
        disabled ? 'opacity-60' : ''
      } ${className}`}
    >
      <View className="flex-row items-center">
        <View className={`mr-3 rounded-2xl ${badgeBg} p-2`}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={{ maxWidth: 230 }}>
          <Text className={`text-base font-semibold ${textColor}`}>
            {title}
          </Text>
          {description ? (
            <Text className="mt-1 text-sm text-neutral-500">{description}</Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </Pressable>
  );
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const typed = error as Partial<ApiError>;
    if (typed.message && typeof typed.message === 'string') {
      const trimmed = typed.message.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return fallback;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data: user, isLoading: isAuthLoading } = useUser();
  const logout = useLogout();
  // 비밀번호 변경 훅 삭제함
  const deleteAccountMutation = useDeleteAccount();

  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  // 비밀번호 관련 state 삭제함
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLogoutProcessing, setIsLogoutProcessing] = useState(false);

  const actionsDisabled = isAuthLoading || !user;

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setDeleteError(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setDeleteError(null);
  };

  const handleLogoutConfirm = async () => {
    if (isLogoutProcessing) {
      return;
    }
    setIsLogoutProcessing(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert(
        '로그아웃 실패',
        '로그아웃 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsLogoutProcessing(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteAccountMutation.isPending) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteAccountMutation.mutateAsync();
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      const message = getErrorMessage(
        error,
        '계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
      setDeleteError(message);
    }
  };

  const renderActiveModal = () => {
    if (!activeModal) {
      return null;
    }

    if (
      activeModal === 'privacy' ||
      activeModal === 'help' ||
      activeModal === 'about'
    ) {
      const content = infoModalCopy[activeModal];
      return (
        <ProfileModal
          visible
          title={content.title}
          onClose={closeModal}
          primaryLabel="확인"
          onPrimary={closeModal}
        >
          {content.body.map((paragraph, index) => (
            <Text
              key={`${activeModal}-${index}`}
              className="text-sm leading-6 text-neutral-600"
              style={
                index === content.body.length - 1
                  ? undefined
                  : { marginBottom: 12 }
              }
            >
              {paragraph}
            </Text>
          ))}
        </ProfileModal>
      );
    }

    // 비밀번호 모달 렌더링 부분 삭제함

    if (activeModal === 'confirmLogout') {
      return (
        <ProfileModal
          visible
          title="로그아웃"
          description="현재 기기에서 로그아웃하시겠어요?"
          onClose={closeModal}
          primaryLabel="로그아웃"
          onPrimary={handleLogoutConfirm}
          secondaryLabel="취소"
          onSecondary={closeModal}
          isPrimaryLoading={isLogoutProcessing}
          isSecondaryDisabled={isLogoutProcessing}
          disableBackdropClose={isLogoutProcessing}
        >
          <Text className="text-center text-sm text-neutral-600">
            다시 로그인하려면 사용자 아이디와 비밀번호가 필요합니다.
          </Text>
        </ProfileModal>
      );
    }

    if (activeModal === 'confirmDelete') {
      return (
        <ProfileModal
          visible
          title="계정을 삭제하시겠어요?"
          description="삭제하시면 저희 너무 슬퍼요..."
          onClose={closeModal}
          primaryLabel="계정 삭제"
          onPrimary={handleDeleteAccountConfirm}
          primaryVariant="danger"
          isPrimaryLoading={deleteAccountMutation.isPending}
          secondaryLabel="취소"
          onSecondary={closeModal}
          isSecondaryDisabled={deleteAccountMutation.isPending}
          disableBackdropClose={deleteAccountMutation.isPending}
        >
          <Text className="text-center text-sm text-neutral-600">
            보관 중인 학습 기록 등이 모두 삭제되며, 되돌릴 수 없어요.
          </Text>
          {deleteError ? (
            <View className="mt-4 rounded-xl bg-red-50 p-3">
              <Text className="text-sm font-semibold text-red-600">
                {deleteError}
              </Text>
            </View>
          ) : null}
        </ProfileModal>
      );
    }

    return null;
  };

  return (
    <View className="flex-1 bg-[#EBF4FB]">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-6 mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <View className="items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
              <Text className="text-3xl font-bold text-white">
                {isAuthLoading
                  ? '...'
                  : user?.nickname?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            {isAuthLoading ? (
              <ActivityIndicator color="#0ea5e9" size="small" />
            ) : (
              <>
                <Text className="mb-1 text-2xl font-bold text-neutral-900">
                  {user?.nickname || 'Guest'}
                </Text>
                <Text className="text-base text-neutral-500">
                  @{user?.username || 'username'}
                </Text>
              </>
            )}
          </View>
        </View>

        <View className="mb-8">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            계정
          </Text>
          {/* 비밀번호 변경 버튼 삭제함 */}
          <ActionRow
            className="mb-3"
            iconName="log-out-outline"
            title="로그아웃"
            description="현재 기기에서 로그아웃합니다."
            onPress={() => openModal('confirmLogout')}
            disabled={actionsDisabled}
          />
          <ActionRow
            iconName="trash-outline"
            title="계정 삭제"
            description="모든 유저 관련 데이터가 삭제됩니다."
            variant="danger"
            onPress={() => openModal('confirmDelete')}
            disabled={actionsDisabled}
          />
        </View>

        <View className="mb-8">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            개인정보 및 보안
          </Text>
          <ActionRow
            iconName="shield-checkmark-outline"
            title="개인정보 보호"
            description="데이터 수집 및 보안 사항"
            onPress={() => openModal('privacy')}
          />
        </View>

        <View className="mb-8">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            도움말 및 지원
          </Text>
          <ActionRow
            iconName="chatbubbles-outline"
            title="도움이 필요하신가요?"
            description="개발자 연락처를 확인하세요."
            onPress={() => openModal('help')}
          />
        </View>

        <View>
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            정보
          </Text>
          <ActionRow
            iconName="information-circle-outline"
            title="LingoFit 소개"
            description="우리가 만들어가는 새로운 리스닝 경험"
            onPress={() => openModal('about')}
          />
        </View>
      </ScrollView>

      {renderActiveModal()}
    </View>
  );
}
