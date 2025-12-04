import React from 'react';

export const PreferencesContext = React.createContext({
  toggleTheme: () => {}, //! still empty behavior, pls fix 
  isThemeDark: false,
});