/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { loadLanguage, saveLanguage } from "../services/storage/mentalWheelStorage";
import {
    getTranslation,
    isLanguage,
    LANGUAGE_DETAILS,
    LANGUAGE_OPTIONS,
    type Language,
    type LanguageDetails,
    type TranslationKey,
    type TranslationParams,
} from "./translations";

interface I18nContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    locale: string;
    languageDetails: LanguageDetails;
    languages: readonly LanguageDetails[];
    t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLanguage(): Language {
    const savedLanguage = loadLanguage("es");
    return isLanguage(savedLanguage) ? savedLanguage : "es";
}

export function I18nProvider({ children }: PropsWithChildren) {
    const [language, setLanguage] = useState<Language>(resolveInitialLanguage);

    useEffect(() => {
        saveLanguage(language);
        document.documentElement.lang = language;
    }, [language]);

    const value = useMemo<I18nContextValue>(() => {
        const languageDetails = LANGUAGE_DETAILS[language];
        return {
            language,
            setLanguage,
            locale: languageDetails.locale,
            languageDetails,
            languages: LANGUAGE_OPTIONS,
            t: (key, params) => getTranslation(language, key, params),
        };
    }, [language]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within I18nProvider");
    }
    return context;
}
