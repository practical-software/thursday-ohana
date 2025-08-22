export type BowlerType = "regular" | "sub";

export type SidePotKey = "scratch" | "handicap" | "optionalSideHandicap";

export interface SidePots {
  scratch: boolean;
  handicap: boolean;
  optionalSideHandicap: boolean;
}

export type MoneyTransferType = "noMoneyYet" | "iGave" | "theyGaveMe";

export interface DoublesEntry {
  id: string;
  partnerName: string;
  moneyTransfer: MoneyTransferType;
}

export interface AppState {
  bowlerType: BowlerType;
  sidePots: SidePots;
  doublesEntries: DoublesEntry[];
  favorites: string[];
  activeTab: string;
}

// Pricing constants
export const PRICING = {
  regular: 17,
  sub: 12,
  scratch: 3,
  handicap: 3,
  optionalSideHandicap: 6,
  doublesTeamCost: 6,
  doublesPartnerPayment: 3,
} as const;

// Fake partner names for autocomplete
export const NAME_LIST = [
  "Landan Yoshida",
  "Iris Umeihra",
  "Shawn Harrison",
  "Mike Cavaggioni",
  "Jeffrey Kanada",
  "Nicholas Kidd",
  "Scott Shiira",
  "Justin Sumiye",
  "Keary Wilkinson",
  "Kevin Enomoto",
  "Micah Freitas",
  "Milo Wilkinson",
  "Weyland Kanada",
  "Raiden Yamashiro",
  "Vince Davis",
  "Micah Grune",
  "Chad Oasay",
  "Shelly Shiira",
  "Rebecca Iha",
  "Kaili Takara",
  "Rachel Iha",
  "Sheila Chamian",
  "Elizabeth Jimenez",
  "Kellina Murakami",
  "Patti Inoue",
  "Celeste You",
  "Blaine Endo",
  "Julian Balmore",
  "Kelly Endo",
  "Juan Limasa",
  "Daniel Toyooka-Lim",
  "Mike Mallon",
  "Ralstan Tanaka",
  "JR Viado",
  "Guy Fujimoto",
  "Randy O’Neal",
  "John Frazier",
  "Bob Magallano",
  "Glen Lim",
  "Ryan Chang",
  "Laura Nagata",
  "Eric Zotter",
  "Corey Adams",
  "Doc Shamoto",
  "Mydee Viado",
  "Kelli Kirio",
  "Allan Quiocho",
  "Logan Murakami",
  "Corey Adams Jr",
  "Ray Takara",
  "Blake Masaaki",
] as const;
