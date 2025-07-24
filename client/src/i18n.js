import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import zh from './locales/zh.json'; // Add this line

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  zh: { translation: zh }, // Add this line
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
