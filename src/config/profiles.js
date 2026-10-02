// config/profiles.js
export const profiles = {
  omsan: {
    id: "omsan",
    name: "Omsan Logistics",
    logo: "/Logo_Omsan.jpeg",
    colors: { primary: "#3b82f6", secondary: "#1e40af" },
    apiTable: "Avaries",
    formFields: {
      marques: ["Renault", "Dacia", "Peugeot", "Citroen", "Toyota", "Volkswagen", "Ford", "Fiat", "Hyundai", "Kia", "BMW", "Mercedes", "Autre"],
      natures: ["Eclat", "Rayure", "Bosse", "Cabosse", "Frottement", "Enforcement", "Ferayeur", "Picot", "Mal plaquet", "Dechire", "Crevaison", "Fissuration", "Casse", "Manque"],
    },
    dashboardColumns: ["date", "chassis", "marque", "modele", "transporteur", "bl", "responsabilite", "provenance", "nature", "position"],
  },

  somaca: {
    id: "somaca",
    name: "Somaca",
    logo: "/Logo_Omsan.jpeg",
    colors: { primary: "#ef4444", secondary: "#991b1b" },
    apiTable: "Avaries",
    formFields: {
      marques: ["Renault", "Dacia", "Peugeot", "Citroen", "Toyota", "Volkswagen", "Ford", "Fiat", "Hyundai", "Kia", "BMW", "Mercedes", "Autre"],
      natures: ["Eclat", "Rayure", "Bosse", "Cabosse", "Frottement", "Enforcement", "Ferayeur", "Picot", "Mal plaquet", "Dechire", "Crevaison", "Fissuration", "Casse", "Manque"],
    },
    dashboardColumns: ["date", "chassis", "marque", "modele", "nature", "position"],
  },
};