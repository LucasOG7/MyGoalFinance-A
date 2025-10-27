// components/LanguageSelector.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  style?: any;
}

export default function LanguageSelector({ style }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setModalVisible(false);
  };

  const getLanguageFlag = (lng: string) => {
    switch (lng) {
      case 'es':
        return '🇪🇸';
      case 'en':
        return '🇺🇸';
      default:
        return '🌐';
    }
  };

  const getLanguageCode = (lng: string) => {
    switch (lng) {
      case 'es':
        return 'ES';
      case 'en':
        return 'EN';
      default:
        return 'ES';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{getLanguageFlag(currentLanguage)}</Text>
        <Text style={styles.code}>{getLanguageCode(currentLanguage)}</Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                currentLanguage === 'es' && styles.selectedOption,
              ]}
              onPress={() => changeLanguage('es')}
            >
              <Text style={styles.optionFlag}>🇪🇸</Text>
              <Text style={styles.optionText}>{t('language.spanish')}</Text>
              {currentLanguage === 'es' && (
                <Ionicons name="checkmark" size={20} color="#f5a623" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                currentLanguage === 'en' && styles.selectedOption,
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.optionFlag}>🇺🇸</Text>
              <Text style={styles.optionText}>{t('language.english')}</Text>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark" size={20} color="#f5a623" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1001,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flag: {
    fontSize: 16,
    marginRight: 4,
  },
  code: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 10000,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
  },
  optionFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});