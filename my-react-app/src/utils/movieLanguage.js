import { useEffect, useState } from "react";

export const getCurrentLanguage = () =>
  localStorage.getItem("language") || "VN";

export const useMovieLanguage = () => {
  const [language, setLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    const updateLanguage = () =>
      setLanguage(getCurrentLanguage());

    window.addEventListener("languageChanged", updateLanguage);
    return () =>
      window.removeEventListener("languageChanged", updateLanguage);
  }, []);

  return language;
};

export const getMovieText = (movie, field, fallback = "") => {
  if (!movie) return fallback;

  const language = getCurrentLanguage();
  const pascalField = field.charAt(0).toUpperCase() + field.slice(1);
  const englishKey = `English${pascalField}`;

  if (language === "EN") {
    return movie[englishKey] || movie[field] || fallback;
  }

  return movie[field] || movie[englishKey] || fallback;
};
