import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useThemeColors, Brand, Radius, Shadows, Spacing } from '../../theme';
import { CloseIcon } from '../icons/BankIcons';

/* ─── Modal ─── */
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const colors = useThemeColors();

  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.card }, Shadows.modal]}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}
          <ScrollView style={styles.modalBody}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

/* ─── ConfirmDialog ─── */
export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
}: ConfirmDialogProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.dialogContent}>
        <Text style={[styles.dialogTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.dialogMessage, { color: colors.mutedForeground }]}>{message}</Text>
        <View style={styles.dialogButtons}>
          <TouchableOpacity
            style={[styles.dialogBtn, { backgroundColor: colors.muted }]}
            onPress={onClose}
          >
            <Text style={[styles.dialogBtnText, { color: colors.text }]}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dialogBtn,
              { backgroundColor: variant === 'danger' ? Brand.error : Brand.primary },
            ]}
            onPress={() => { onConfirm(); onClose(); }}
          >
            <Text style={[styles.dialogBtnText, { color: '#fff' }]}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalContent: { borderRadius: Radius.xl, width: '100%', maxHeight: '80%', overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  closeButton: { padding: 4 },
  modalBody: { padding: Spacing.xl },
  dialogContent: { alignItems: 'center' },
  dialogTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  dialogMessage: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  dialogButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  dialogBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
    minHeight: 48,
  },
  dialogBtnText: { fontWeight: '600', fontSize: 15 },
});
