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
export const FAKE_PARTNER_NAMES = [
  "Alex Rivera",
  "Jordan Blake",
  "Taylor Kim",
  "Morgan Lee",
  "Riley Adams",
  "Casey Nguyen",
  "Sam Patel",
  "Quinn Johnson",
  "Jamie Carter",
  "Drew Martinez",
  "Charlie Brooks",
  "Avery Thompson",
  "Harper Diaz",
  "Rowan Bennett",
  "Emery Scott",
] as const;
