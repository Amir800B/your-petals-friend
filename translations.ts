
import { Language, TranslationStrings } from './types';

export const translations: Record<Language, TranslationStrings> = {
  [Language.EN]: {
    navHome: "Home",
    navProducts: "Gallery",
    navOrder: "Order Now",
    navAdmin: "Admin",
    heroTitle: "Petals Crafted with Love",
    heroSub: "Experience the elegance of premium floral arrangements tailored for your most precious moments.",
    ctaShopNow: "Explore Collection",
    orderFormTitle: "Reserve Your Bouquet",
    btnSubmitOrder: "Send Order",
    successMsg: "Your order has been recorded! Our special team will contact you soon.",
    cartTitle: "Your Selection",
    total: "Total",
    checkout: "Proceed to Checkout",
    emptyCart: "Your cart is as empty as a winter garden.",
    aiAssistant: "Floral Assistant",
    aiPrompt: "Tell me the occasion, and I'll suggest the perfect flowers!",
    adminTitle: "Order Management",
    logout: "Logout"
  },
  [Language.ID]: {
    navHome: "Beranda",
    navProducts: "Galeri",
    navOrder: "Pesan Sekarang",
    navAdmin: "Admin",
    heroTitle: "Kelopak Dibuat dengan Cinta",
    heroSub: "Rasakan keanggunan rangkaian bunga premium yang disesuaikan untuk momen paling berharga Anda.",
    ctaShopNow: "Jelajahi Koleksi",
    orderFormTitle: "Reservasi Buket Anda",
    btnSubmitOrder: "Kirim Pesanan",
    successMsg: "Pesanan Anda telah dicatat! Tim khusus kami akan segera menghubungi Anda.",
    cartTitle: "Pilihan Anda",
    total: "Total",
    checkout: "Lanjutkan ke Pembayaran",
    emptyCart: "Keranjang Anda kosong seperti taman di musim dingin.",
    aiAssistant: "Asisten Bunga",
    aiPrompt: "Beri tahu saya acaranya, dan saya akan menyarankan bunga yang sempurna!",
    adminTitle: "Manajemen Pesanan",
    logout: "Keluar"
  }
};
