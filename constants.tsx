
import { Product, Language } from './types';

export const WA_NUMBER = "6287825194034";
export const LOCATION = "Jakarta, Indonesia";
export const ADMIN_PASSWORD = "admin123";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: { [Language.EN]: "Royal Crimson Bouquet", [Language.ID]: "Buket Merah Kerajaan" },
    description: { [Language.EN]: "Deep red roses for eternal passion.", [Language.ID]: "Mawar merah tua untuk gairah abadi." },
    price: 450000,
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=800",
    category: "Classic"
  },
  {
    id: "p2",
    name: { [Language.EN]: "Pastel Dreams", [Language.ID]: "Mimpi Pastel" },
    description: { [Language.EN]: "A soft mix of lilies and carnations.", [Language.ID]: "Campuran lembut bunga bakung dan anyelir." },
    price: 325000,
    image: "https://images.unsplash.com/photo-1596073413908-43524c08ee3a?q=80&w=800",
    category: "Modern"
  },
  {
    id: "p3",
    name: { [Language.EN]: "Morning Sunshine", [Language.ID]: "Mentari Pagi" },
    description: { [Language.EN]: "Bright sunflowers to light up any room.", [Language.ID]: "Bunga matahari cerah untuk mencerahkan ruangan." },
    price: 280000,
    image: "https://images.unsplash.com/photo-1512423336473-b3469396e953?q=80&w=800",
    category: "Joy"
  },
  {
    id: "p4",
    name: { [Language.EN]: "Whispering White", [Language.ID]: "Putih Berbisik" },
    description: { [Language.EN]: "Elegant white tulips for pure beginnings.", [Language.ID]: "Tulip putih elegan untuk awal yang murni." },
    price: 380000,
    image: "https://images.unsplash.com/photo-1589129140837-67287c22521b?q=80&w=800",
    category: "Elegance"
  }
];
