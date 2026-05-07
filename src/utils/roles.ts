import { log } from "console";

export const getDashboardUrlByRole = (role?: string): string => {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard"; // Ajustez selon vos routes
    case "ORGANISATEUR":
      return "/organizer/dashboard";
    case "CONFERENCIER":
      return "/conferencier/dashboard";
    case "PARTICIPANT":
    default:
      return "/participant/dashboard"; // Ou simplement "/dashboard"
  }
};

export const getMenuUrlByRole = (role?: string): string => {
  switch (role) {
    case "ADMIN":
      return "/admin"; // Ajustez selon vos routes
    case "ORGANISATEUR":
      return "/organizer";
    case "CONFERENCIER":
      return "/conferencier";
    case "PARTICIPANT":
    default:
      return "/participant"; // Ou simplement "/dashboard"
  }
};