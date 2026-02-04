
export enum Language {
  EN = 'EN',
  ID = 'ID'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Product {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  product_name: string; 
  product_id: string;
  items?: CartItem[];
  total_price?: number;
  quantity: number;
  address: string;
  delivery_date: string;
  delivery_time: string;
  notes: string;
  status: OrderStatus;
  createdAt: string;
}

export interface TranslationStrings {
  navHome: string;
  navProducts: string;
  navOrder: string;
  navAdmin: string;
  heroTitle: string;
  heroSub: string;
  ctaShopNow: string;
  orderFormTitle: string;
  btnSubmitOrder: string;
  successMsg: string;
  cartTitle: string;
  total: string;
  checkout: string;
  emptyCart: string;
  aiAssistant: string;
  aiPrompt: string;
  adminTitle: string;
  logout: string;
}
