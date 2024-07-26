import React, { createContext, useContext, useState } from "react";

// context
const TranslationContext = createContext();

// provider
export default function Translation({ children }) {


  // state
  const [language, setLanguage] = useState("en");

  return (
    <TranslationContext.Provider value={{ language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
}

// useContext
export const useTranslation = () => {
  const { language, setLanguage } = useContext(TranslationContext);
  return { language, setLanguage };
};
