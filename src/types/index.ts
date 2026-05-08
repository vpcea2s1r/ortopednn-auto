export interface ContactInfo {
  phone: string;
  phoneDisplay: string;
  telegram?: string;
  whatsapp?: string;
}

export interface LocationInfo {
  address: string;
  metro?: string[];
  note?: string;
}

export interface DocumentLink {
  type: 'license' | 'diploma' | 'cert';
  label: string;
  url: string;
}

export interface LegalInfo {
  consentText: string;
  disclaimer: string;
}

export interface Doctor {
  name: string;
  specialty: string;
  experience?: string;
  photo?: string;
  utp?: string[];
  phone: string;
  phoneDisplay: string;
  address: string;
  documents?: DocumentLink[];
  legal?: LegalInfo;
}

export interface District {
  slug: string;
  name: string;
  metro?: string[];
  transport?: string;
  localFaq?: { q: string; a: string }[];
}

export interface PricingItem {
  name: string;
  price: string;
  link?: string;
  code?: string;
  includes?: string[];
  comparison?: string;
}

export interface PricingCategory {
  category: string;
  items: PricingItem[];
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
  enabled: boolean;
  priority: number;
  status?: 'active_ru' | 'standby' | 'restricted_ru';
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: 'pain' | 'durability' | 'payment' | 'process';
}