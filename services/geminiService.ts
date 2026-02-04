
import { GoogleGenAI } from "@google/genai";

// قاعدة بيانات محلية للاقتراحات تعمل فوراً بدون API
const LOCAL_SUGGESTIONS: Record<string, { EN: string; ID: string }> = {
  birthday: {
    EN: "For birthdays, we suggest 'Morning Sunshine'. Bright sunflowers and yellow lilies to celebrate a new year of life!",
    ID: "Untuk ulang tahun, kami menyarankan 'Mentari Pagi'. Bunga matahari cerah dan lili kuning untuk merayakan tahun baru kehidupan!"
  },
  wedding: {
    EN: "For weddings, 'Whispering White' is perfection. Elegant white tulips and lilies symbolizing pure and eternal beginnings.",
    ID: "Untuk pernikahan, 'Putih Berbisik' sangat sempurna. Tulip putih elegan dan lili yang melambangkan awal yang murni dan abadi."
  },
  anniversary: {
    EN: "Celebrate love with 'Royal Crimson'. Deep red roses that speak of eternal passion and devotion.",
    ID: "Rayakan cinta dengan 'Buket Merah Kerajaan'. Mawar merah tua yang berbicara tentang gairah dan pengabdian abadi."
  },
  romantic: {
    EN: "For a romantic gesture, nothing beats our 'Pastel Dreams'. A soft, enchanting mix that captures the heart.",
    ID: "Untuk gerakan romantis, tidak ada yang mengalahkan 'Mimpi Pastel' kami. Campuran lembut dan mempesona yang memikat hati."
  },
  apology: {
    EN: "A sincere apology deserves 'Whispering White'. Pure white blooms to show genuine regret and hope for peace.",
    ID: "Permintaan maaf yang tulus layak mendapatkan 'Putih Berbisik'. Mekar putih bersih untuk menunjukkan penyesalan tulus dan harapan akan kedamaian."
  },
  graduation: {
    EN: "For graduation, go with bright and bold! Sunflowers and orange carnations to honor great achievements.",
    ID: "Untuk kelulusan, pilih yang cerah dan berani! Bunga matahari dan anyelir oranye untuk menghormati pencapaian besar."
  },
  sympathy: {
    EN: "In times of sympathy, white lilies provide comfort and grace. We recommend a soft, respectful arrangement.",
    ID: "Di saat simpati, lili putih memberikan kenyamanan dan keanggunan. Kami merekomendasikan rangkaian yang lembut dan penuh hormat."
  },
  default: {
    EN: "Every occasion is special! A classic mix of seasonal pastel roses never fails to bring a smile.",
    ID: "Setiap kesempatan itu istimewa! Campuran klasik mawar pastel musiman tidak pernah gagal membawa senyuman."
  }
};

export const getFlowerRecommendation = async (prompt: string, lang: string) => {
  const normalizedPrompt = prompt.toLowerCase();
  const selectedLang = lang === 'EN' ? 'EN' : 'ID';

  // البحث عن كلمات مفتاحية في النص الذي كتبه المستخدم
  let occasion = 'default';
  if (normalizedPrompt.includes('birth')) occasion = 'birthday';
  else if (normalizedPrompt.includes('wed') || normalizedPrompt.includes('marry')) occasion = 'wedding';
  else if (normalizedPrompt.includes('anniv')) occasion = 'anniversary';
  else if (normalizedPrompt.includes('love') || normalizedPrompt.includes('romance')) occasion = 'romantic';
  else if (normalizedPrompt.includes('sorry') || normalizedPrompt.includes('apolog')) occasion = 'apology';
  else if (normalizedPrompt.includes('gradu')) occasion = 'graduation';
  else if (normalizedPrompt.includes('sad') || normalizedPrompt.includes('die') || normalizedPrompt.includes('loss')) occasion = 'sympathy';

  // محاولة الاتصال بـ Gemini إذا كان المفتاح موجوداً، وإلا استخدام الرد المحلي
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === '') {
      // إذا لم يوجد مفتاح، نستخدم الرد المحلي فوراً
      return LOCAL_SUGGESTIONS[occasion][selectedLang];
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User wants a flower recommendation for: "${prompt}". 
      Context identified as: ${occasion}. 
      Suggest 3 types of flowers or bouquet styles. Keep it short and poetic. 
      Language: ${lang === 'EN' ? 'English' : 'Indonesian'}.`,
    });
    
    return response.text || LOCAL_SUGGESTIONS[occasion][selectedLang];
  } catch (error) {
    console.warn("Gemini offline or key missing, using local suggestions system.");
    // في حال حدوث أي خطأ، نعود للاقتراحات المحلية لضمان تجربة مستخدم مستمرة
    return LOCAL_SUGGESTIONS[occasion][selectedLang];
  }
};
