
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Language, Order, Product, OrderStatus, CartItem } from "./types";
import { translations } from "./translations";
import { WA_NUMBER, ADMIN_PASSWORD } from "./constants";
import { getOrders, createOrder, updateOrderStatus, deleteOrder } from "./services/orderService";
import { getProducts, saveProducts } from "./services/productService";
import { Logo } from "./components/Logo";
import { getFlowerRecommendation } from "./services/geminiService";

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.ID);
  const [activePage, setActivePage] = useState<string>('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Admin specific state
  const [adminTab, setAdminTab] = useState<'orders' | 'inventory' | 'stats'>('orders');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [previewImage, setPreviewImage] = useState<string>("");

  // Form State for Order
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    delivery_date: '',
    delivery_time: '',
    notes: '',
    product_name: ''
  });

  const t = useMemo(() => translations[lang], [lang]);

  useEffect(() => {
    setProducts(getProducts());
    const savedCart = localStorage.getItem('ypf_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('ypf_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (isAdminLoggedIn) setOrders(getOrders());
    window.scrollTo(0, 0);
  }, [activePage, isAdminLoggedIn]);

  const toggleLang = () => {
    setLang(prev => prev === Language.ID ? Language.EN : Language.ID);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsList = cart.length > 0 ? cart : products.filter(p => p.name[lang] === orderForm.product_name).map(p => ({...p, quantity: 1}));
    const productSummary = itemsList.map(i => `${i.name[lang]} x${i.quantity}`).join(', ');
    
    // Create the order in the system (Dashboard)
    createOrder({
      ...orderForm,
      product_name: productSummary,
      quantity: cartCount || 1,
      total_price: cartTotal
    });
    
    // Success flow
    setShowSuccess(true);
    setOrderForm({ customer_name: '', phone: '', address: '', delivery_date: '', delivery_time: '', notes: '', product_name: '' });
    setCart([]);
    
    // Redirect home after a small delay
    setTimeout(() => {
      setShowSuccess(false);
      setActivePage('home');
    }, 6000);
  };

  const handleAiAsk = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const res = await getFlowerRecommendation(aiPrompt, lang);
    setAiResponse(res || "");
    setIsAiLoading(false);
  };

  const loginAdmin = () => {
    if (adminPass === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setActivePage('admin');
    } else {
      alert("Invalid Password");
    }
  };

  // Image Upload Handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin Inventory Logic
  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: {
        [Language.EN]: formData.get('name_en') as string,
        [Language.ID]: formData.get('name_id') as string,
      },
      description: {
        [Language.EN]: formData.get('desc_en') as string,
        [Language.ID]: formData.get('desc_id') as string,
      },
      price: Number(formData.get('price')),
      image: previewImage || editingProduct?.image || "",
      category: formData.get('category') as string,
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? productData : p);
    } else {
      updatedProducts = [productData, ...products];
    }
    
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setPreviewImage("");
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setPreviewImage(p.image);
    setIsProductModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setPreviewImage("");
    setIsProductModalOpen(true);
  };

  // Stats
  const totalRevenue = orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + (o.total_price || 0), 0);
  const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;

  // Exclusive products for home (first 4)
  const exclusiveProducts = products.slice(0, 4);

  const selectedProductData = products.find(p => p.name[lang] === orderForm.product_name);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-rose-100 selection:text-rose-600">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo onClick={() => setActivePage('home')} />
          <div className="hidden lg:flex items-center gap-10">
             <div className="flex gap-10 text-[15px] font-bold text-gray-500">
                {['home', 'products'].map(page => (
                  <button 
                    key={page}
                    onClick={() => setActivePage(page)} 
                    className={`pb-1 transition-all capitalize ${activePage === page ? 'text-rose-500 border-b-2 border-rose-500' : 'hover:text-rose-500'}`}
                  >
                    {t[`nav${page.charAt(0).toUpperCase() + page.slice(1)}` as keyof typeof t]}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-5 border-l pl-10 border-gray-200">
                <button onClick={toggleLang} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 font-bold text-xs uppercase text-gray-700 hover:bg-gray-100 transition-all active:scale-95">
                  <i className="fa-solid fa-globe text-rose-400"></i> {lang}
                </button>
                <button onClick={() => setIsCartOpen(true)} className="relative h-12 w-12 rounded-full border border-gray-100 flex items-center justify-center text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-500 shadow-sm transition-all active:scale-90">
                  <i className="fa-solid fa-cart-shopping"></i>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-lg animate-bounce">{cartCount}</span>}
                </button>
                <button onClick={() => setActivePage('order')} className="bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold shadow-xl hover:bg-rose-500 hover:scale-105 transition-all duration-300 active:scale-95">{t.navOrder}</button>
             </div>
          </div>
          <div className="lg:hidden flex items-center gap-4">
            <button onClick={() => setIsCartOpen(true)} className="relative text-2xl h-10 w-10 flex items-center justify-center">
              <i className="fa-solid fa-cart-shopping text-slate-700"></i>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
            <button className="text-2xl h-10 w-10 flex items-center justify-center" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'} text-slate-900`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
           <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-serif">{t.cartTitle}</h2>
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-600 transition-colors tracking-widest pt-1">Clear Cart</button>
                  )}
                </div>
                <button onClick={() => setIsCartOpen(false)} className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl text-slate-100 mb-6 inline-block"><i className="fa-solid fa-basket-shopping"></i></div>
                    <p className="text-slate-400 font-medium">{t.emptyCart}</p>
                    <button onClick={() => {setActivePage('products'); setIsCartOpen(false)}} className="mt-6 text-rose-500 font-bold hover:underline">Explore Flowers</button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-5 group items-center">
                      <div className="h-24 w-24 rounded-3xl overflow-hidden flex-shrink-0 shadow-md">
                        <img src={item.image} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" alt={item.name[lang]} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.name[lang]}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors ml-2"><i className="fa-solid fa-circle-xmark"></i></button>
                        </div>
                        <p className="text-sm font-semibold text-rose-500 mb-4">IDR {item.price.toLocaleString()}</p>
                        <div className="inline-flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-[10px] text-slate-600 hover:bg-rose-50 transition-all"><i className="fa-solid fa-minus"></i></button>
                          <span className="text-sm font-black w-10 text-center tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-[10px] text-slate-600 hover:bg-rose-50 transition-all"><i className="fa-solid fa-plus"></i></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-8 border-t border-gray-100 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t.total}</span>
                    <span className="text-3xl font-serif text-slate-900 font-bold">IDR {cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => {setIsCartOpen(false); setActivePage('order')}} className="w-full bg-rose-500 text-white py-6 rounded-full font-bold text-lg shadow-xl hover:bg-slate-900 transition-all duration-300 active:scale-95">{t.checkout}</button>
                </div>
              )}
           </div>
        </div>
      )}

      <main className="flex-grow">
        {activePage === 'home' && (
          <>
            <section className="relative h-[85vh] flex items-center overflow-hidden">
              <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2000" className="w-full h-full object-cover" alt="Hero" />
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
              </div>
              <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 items-center">
                 <div className="text-left animate-in fade-in slide-in-from-left duration-1000">
                   <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block">Premium Boutique</span>
                   <h1 className="text-6xl md:text-8xl font-serif text-slate-900 mb-8 leading-[1.1]">{t.heroTitle}</h1>
                   <p className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">{t.heroSub}</p>
                   <div className="flex flex-col sm:flex-row gap-5">
                    <button onClick={() => setActivePage('products')} className="bg-rose-500 text-white px-10 py-5 rounded-full font-bold shadow-2xl hover:bg-slate-900 transition-all transform hover:-translate-y-1 active:scale-95">{t.ctaShopNow}</button>
                    <button onClick={() => setActivePage('order')} className="bg-white text-slate-900 px-10 py-5 rounded-full font-bold border border-gray-200 shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 active:scale-95">{t.navOrder}</button>
                   </div>
                 </div>
              </div>
            </section>

            {/* Exclusive Products Section */}
            <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                 <div className="text-center mb-16">
                    <span className="text-rose-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Handpicked for you</span>
                    <h2 className="text-5xl font-serif text-slate-900">Exclusive Collection</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {exclusiveProducts.map(p => (
                     <div key={p.id} className="group cursor-pointer">
                       <div className="relative h-96 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                         <img src={p.image} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-700" alt={p.name[lang]} />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                            <button 
                              onClick={() => addToCart(p)}
                              className="bg-white text-slate-900 w-full py-4 rounded-full font-bold mb-3 hover:bg-rose-500 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 active:scale-95"
                            >
                              Add to Selection
                            </button>
                            <button 
                              onClick={() => {setOrderForm({...orderForm, product_name: p.name[lang]}); setActivePage('order')}}
                              className="bg-rose-500/20 backdrop-blur-md text-white border border-white/30 w-full py-4 rounded-full font-bold hover:bg-white/20 transition-all transform translate-y-8 group-hover:translate-y-0 duration-700 active:scale-95"
                            >
                              Buy Direct
                            </button>
                         </div>
                         <div className="absolute top-6 right-6">
                            <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Exclusive</span>
                         </div>
                       </div>
                       <div className="mt-6 text-center">
                         <h3 className="text-xl font-bold text-slate-900 mb-1">{p.name[lang]}</h3>
                         <p className="text-rose-500 font-bold">IDR {p.price.toLocaleString()}</p>
                       </div>
                     </div>
                   ))}
                 </div>
                 <div className="text-center mt-16">
                    <button onClick={() => setActivePage('products')} className="text-slate-400 font-bold hover:text-rose-500 transition-colors flex items-center gap-3 mx-auto uppercase tracking-widest text-xs active:scale-95">
                       View Full Gallery <i className="fa-solid fa-arrow-right-long"></i>
                    </button>
                 </div>
              </div>
            </section>

            {/* AI Assistant Section */}
            <section className="py-24 bg-rose-50 relative overflow-hidden">
               <div className="max-w-4xl mx-auto px-6 relative z-10">
                 <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border border-rose-100">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="h-12 w-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-rose-200"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                       <h2 className="text-3xl font-serif">{t.aiAssistant}</h2>
                    </div>
                    <p className="text-gray-600 mb-8">{t.aiPrompt}</p>
                    <div className="flex gap-4 mb-8">
                       <input className="flex-grow px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 ring-rose-300 outline-none transition-all font-medium" placeholder="Occasion..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAiAsk()} />
                       <button onClick={handleAiAsk} className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 shadow-xl transition-all disabled:opacity-50 active:scale-95" disabled={isAiLoading}>
                         {isAiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : "Ask"}
                       </button>
                    </div>
                    {aiResponse && <div className="p-8 bg-rose-50/50 rounded-[2rem] border border-rose-100 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-inner"><p className="italic text-slate-700 whitespace-pre-wrap leading-relaxed">{aiResponse}</p></div>}
                 </div>
               </div>
            </section>
          </>
        )}

        {activePage === 'products' && (
           <section className="py-24 animate-in fade-in duration-700">
             <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-5xl font-serif mb-16">The Floral Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group text-left">
                      <div className="h-80 relative overflow-hidden">
                        <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={p.name[lang]} />
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                           <span className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full font-bold text-sm shadow-sm">IDR {p.price.toLocaleString()}</span>
                           <div className="flex gap-2">
                             <button onClick={() => addToCart(p)} className="h-12 w-12 bg-white text-rose-500 rounded-full flex items-center justify-center border border-rose-100 shadow-lg active:scale-90"><i className="fa-solid fa-cart-plus"></i></button>
                             <button onClick={() => {setOrderForm({...orderForm, product_name: p.name[lang]}); setActivePage('order')}} className="h-12 w-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90"><i className="fa-solid fa-plus"></i></button>
                           </div>
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="text-2xl font-bold mb-3">{p.name[lang]}</h3>
                        <p className="text-gray-500 line-clamp-2 leading-relaxed">{p.description[lang]}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           </section>
        )}

        {activePage === 'order' && (
          <section className="py-24 bg-white animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="max-w-5xl mx-auto px-6">
              <div className="bg-slate-50 rounded-[4rem] p-10 md:p-20 border border-slate-100 relative shadow-inner">
                <h2 className="text-5xl font-serif mb-10 text-slate-900 text-center">{t.orderFormTitle}</h2>
                <form onSubmit={handleOrderSubmit} className="space-y-8 max-w-3xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-8">
                    <input required placeholder="Name" className="w-full px-8 py-5 rounded-full bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-bold" value={orderForm.customer_name} onChange={e => setOrderForm({...orderForm, customer_name: e.target.value})} />
                    <input required placeholder="WhatsApp Number" className="w-full px-8 py-5 rounded-full bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-bold" value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} />
                  </div>
                  
                  {/* Visual Product Selection Dropdown */}
                  <div className="relative" ref={productDropdownRef}>
                    <button 
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      className="w-full px-8 py-5 rounded-full bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-bold text-left flex items-center justify-between transition-all"
                    >
                      {selectedProductData ? (
                        <div className="flex items-center gap-4">
                          <img src={selectedProductData.image} className="h-10 w-10 rounded-full object-cover" alt="" />
                          <div className="flex flex-col">
                            <span className="text-slate-900 leading-none">{selectedProductData.name[lang]}</span>
                            <span className="text-[10px] text-rose-500 mt-1">IDR {selectedProductData.price.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Product Selection</span>
                      )}
                      <i className={`fa-solid fa-chevron-down text-rose-400 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    
                    {isProductDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                           {products.map(p => (
                             <button 
                               key={p.id}
                               type="button"
                               onClick={() => {
                                 setOrderForm({...orderForm, product_name: p.name[lang]});
                                 setIsProductDropdownOpen(false);
                               }}
                               className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${orderForm.product_name === p.name[lang] ? 'bg-rose-50 border border-rose-100 shadow-sm' : 'hover:bg-slate-50'}`}
                             >
                                <img src={p.image} className="h-16 w-16 rounded-2xl object-cover shadow-sm" alt="" />
                                <div className="text-left flex-grow">
                                  <p className="font-bold text-slate-900">{p.name[lang]}</p>
                                  <p className="text-xs text-rose-500 font-bold mt-1">IDR {p.price.toLocaleString()}</p>
                                </div>
                                {orderForm.product_name === p.name[lang] && <i className="fa-solid fa-circle-check text-rose-500"></i>}
                             </button>
                           ))}
                           <button 
                             type="button"
                             onClick={() => {
                               setOrderForm({...orderForm, product_name: 'Custom Order'});
                               setIsProductDropdownOpen(false);
                             }}
                             className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-50 transition-all text-left"
                           >
                              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <i className="fa-solid fa-wand-sparkles text-2xl"></i>
                              </div>
                              <div className="flex-grow">
                                <p className="font-bold text-slate-900 italic underline">Custom / Other Request</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Price based on request</p>
                              </div>
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Delivery Date */}
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10 pointer-events-none">
                        <i className="fa-solid fa-calendar-day text-rose-500 text-xl"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</span>
                      </div>
                      <input 
                        required 
                        type="date" 
                        className="w-full pl-28 pr-8 py-5 rounded-full bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-bold text-slate-900 transition-all cursor-pointer hover:shadow-md block h-[68px]" 
                        value={orderForm.delivery_date} 
                        onChange={e => setOrderForm({...orderForm, delivery_date: e.target.value})} 
                      />
                    </div>

                    {/* Delivery Time */}
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10 pointer-events-none">
                        <i className="fa-solid fa-clock text-rose-500 text-xl"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</span>
                      </div>
                      <input 
                        required 
                        type="time" 
                        className="w-full pl-28 pr-8 py-5 rounded-full bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-bold text-slate-900 transition-all cursor-pointer hover:shadow-md block h-[68px]" 
                        value={orderForm.delivery_time} 
                        onChange={e => setOrderForm({...orderForm, delivery_time: e.target.value})} 
                      />
                    </div>
                  </div>

                  <textarea required placeholder="Delivery Address" className="w-full px-8 py-5 rounded-[2.5rem] bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-medium" rows={3} value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} />
                  
                  {/* Greeting Card */}
                  <textarea placeholder="Greeting Card Message / Special Notes" className="w-full px-8 py-5 rounded-[2.5rem] bg-white border-none shadow-sm outline-none focus:ring-2 ring-rose-200 font-medium" rows={2} value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} />
                  
                  {/* Primary Order Button - Enhanced shape and visibility */}
                  <button type="submit" className="w-full bg-rose-500 text-white py-6 rounded-full font-bold text-xl hover:bg-slate-900 transition-all transform hover:-translate-y-1 shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                    <i className="fa-solid fa-paper-plane text-lg animate-pulse"></i>
                    {t.btnSubmitOrder}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* --- PROFESSIONAL ADMIN DASHBOARD --- */}
        {activePage === 'admin' && (
          <section className="py-24 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-6">
              {!isAdminLoggedIn ? (
                <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center animate-in zoom-in duration-300">
                  <h2 className="text-3xl font-serif mb-8 text-slate-900">Admin Access</h2>
                  <input type="password" placeholder="Password" className="w-full px-6 py-4 rounded-2xl border border-gray-100 mb-6 shadow-inner" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && loginAdmin()} />
                  <button onClick={loginAdmin} className="w-full bg-slate-900 text-white py-4 rounded-full font-bold shadow-lg active:scale-95">Unlock Dashboard</button>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                      <h2 className="text-5xl font-serif text-slate-900">Dashboard</h2>
                      <p className="text-slate-500 mt-2 font-medium">Business Operations Console</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={openCreateModal} className="bg-rose-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 active:scale-95">
                        <i className="fa-solid fa-plus"></i> New Product
                      </button>
                      <button onClick={() => setIsAdminLoggedIn(false)} className="bg-white border border-gray-200 px-6 py-3 rounded-full font-bold hover:text-rose-500 transition-all active:scale-95">Logout</button>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
                       <div className="h-14 w-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fa-solid fa-coins"></i></div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Revenue</p>
                         <h3 className="text-2xl font-serif text-slate-900">IDR {totalRevenue.toLocaleString()}</h3>
                       </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
                       <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fa-solid fa-clock"></i></div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Tasks</p>
                         <h3 className="text-2xl font-serif text-rose-500">{pendingCount} orders</h3>
                       </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
                       <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fa-solid fa-leaf"></i></div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Inventory</p>
                         <h3 className="text-2xl font-serif text-slate-900">{products.length} bouquets</h3>
                       </div>
                    </div>
                  </div>

                  {/* Professional Tabs Interface */}
                  <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl w-fit shadow-sm border border-gray-100">
                    {(['orders', 'inventory', 'stats'] as const).map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setAdminTab(tab)}
                        className={`px-10 py-3 rounded-xl font-bold capitalize transition-all ${adminTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* --- ORDERS CONSOLE --- */}
                  {adminTab === 'orders' && (
                    <div className="space-y-6">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(['ALL', ...Object.values(OrderStatus)] as const).map(f => (
                          <button 
                            key={f}
                            onClick={() => setOrderFilter(f)}
                            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderFilter === f ? 'bg-rose-500 text-white shadow-sm' : 'bg-white text-slate-400 border border-gray-100'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <div className="grid gap-6">
                        {orders.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200 text-slate-400">No matching orders found.</div>}
                        {orders.filter(o => orderFilter === 'ALL' || o.status === orderFilter).map(order => (
                          <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 flex flex-col lg:flex-row gap-10 shadow-sm hover:shadow-lg transition-all border-l-[8px] border-l-rose-500">
                             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-widest">Customer</p>
                                  <p className="font-bold text-lg text-slate-900">{order.customer_name}</p>
                                  <a href={`https://wa.me/${order.phone}`} target="_blank" className="text-sm text-rose-500 font-bold hover:underline flex items-center gap-2 mt-1">
                                    <i className="fa-brands fa-whatsapp"></i>{order.phone}
                                  </a>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-widest">Details</p>
                                  <p className="font-bold text-sm text-slate-600 truncate">{order.product_name}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                      order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                                      order.status === OrderStatus.PROCESSING ? 'bg-blue-100 text-blue-600' :
                                      order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-600' :
                                      'bg-amber-100 text-amber-600'
                                    }`}>{order.status}</span>
                                    <p className="text-xs font-bold text-slate-900">IDR {(order.total_price || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-widest">Schedule</p>
                                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><i className="fa-regular fa-calendar-check text-rose-400"></i>{order.delivery_date}</p>
                                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-2"><i className="fa-regular fa-clock text-slate-300"></i>{order.delivery_time}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-widest">Logistics</p>
                                  <p className="text-[11px] leading-relaxed bg-slate-50 p-3 rounded-2xl border border-gray-50 text-slate-600 mb-2 shadow-inner">{order.address}</p>
                                  {order.notes && <p className="text-[10px] italic text-rose-400 bg-rose-50 px-2 py-1 rounded-lg">Card: {order.notes}</p>}
                                </div>
                             </div>
                             <div className="flex flex-row lg:flex-col gap-2 border-l border-gray-100 pl-0 lg:pl-10">
                                <button onClick={() => {updateOrderStatus(order.id, OrderStatus.PROCESSING); setOrders(getOrders())}} className="h-12 w-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-90" title="Mark as Processing"><i className="fa-solid fa-spinner"></i></button>
                                <button onClick={() => {updateOrderStatus(order.id, OrderStatus.COMPLETED); setOrders(getOrders())}} className="h-12 w-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-90" title="Mark as Complete"><i className="fa-solid fa-check"></i></button>
                                <button onClick={() => {deleteOrder(order.id); setOrders(getOrders())}} className="h-12 w-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90" title="Remove Entry"><i className="fa-solid fa-trash"></i></button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- INVENTORY CONSOLE --- */}
                  {adminTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                       <div 
                         onClick={openCreateModal}
                         className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 group cursor-pointer hover:border-rose-500 transition-all active:scale-95"
                       >
                          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all mb-4 shadow-inner">
                            <i className="fa-solid fa-plus text-3xl"></i>
                          </div>
                          <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-rose-500">Catalog New Arrival</p>
                       </div>
                       {products.map(p => (
                         <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition-all relative">
                            <div className="h-56 relative overflow-hidden">
                               <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all backdrop-blur-[2px]">
                                  <button onClick={() => openEditModal(p)} className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl hover:scale-110 transition-transform active:scale-90"><i className="fa-solid fa-pen"></i></button>
                                  <button onClick={() => handleDeleteProduct(p.id)} className="h-14 w-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform active:scale-90"><i className="fa-solid fa-trash"></i></button>
                               </div>
                            </div>
                            <div className="p-8">
                               <h4 className="font-bold text-slate-900 truncate text-lg">{p.name[lang]}</h4>
                               <p className="text-rose-500 font-bold text-sm mt-1">IDR {p.price.toLocaleString()}</p>
                               <div className="flex justify-between items-center mt-4">
                                 <span className="px-3 py-1 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-full">{p.category}</span>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* --- ANALYTICS CONSOLE --- */}
                  {adminTab === 'stats' && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm w-full max-w-2xl shadow-xl shadow-slate-100">
                          <h3 className="text-2xl font-serif mb-10 text-slate-900 text-center">Performance Overview</h3>
                          <div className="space-y-8">
                             <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-gray-50">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-500"><i className="fa-solid fa-chart-line"></i></div>
                                  <span className="text-slate-600 font-bold">Total Revenue</span>
                                </div>
                                <span className="text-xl font-serif text-slate-900">IDR {totalRevenue.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-gray-50">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500"><i className="fa-solid fa-receipt"></i></div>
                                  <span className="text-slate-600 font-bold">Total Orders</span>
                                </div>
                                <span className="text-xl font-serif text-slate-900">{orders.length} orders</span>
                             </div>
                             <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-gray-50">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500"><i className="fa-solid fa-calculator"></i></div>
                                  <span className="text-slate-600 font-bold">Avg Transaction</span>
                                </div>
                                <span className="text-xl font-serif text-slate-900">IDR {(orders.length ? Math.floor(totalRevenue / orders.length) : 0).toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* --- PRODUCT MANAGEMENT MODAL --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-10">
           <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={() => {setIsProductModalOpen(false); setEditingProduct(null); setPreviewImage("");}}></div>
           <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl p-10 md:p-20 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-4xl font-serif text-slate-900">{editingProduct ? 'Update Collection' : 'Catalog New Arrival'}</h3>
                <button onClick={() => {setIsProductModalOpen(false); setEditingProduct(null); setPreviewImage("");}} className="h-12 w-12 rounded-full flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <form onSubmit={handleSaveProduct} className="grid md:grid-cols-2 gap-12 lg:gap-20">
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Bouquet Image</label>
                       <div className="relative h-64 w-full bg-slate-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group shadow-inner">
                          {previewImage ? (
                            <div className="h-full w-full relative">
                              <img src={previewImage} className="h-full w-full object-cover" alt="Preview" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                <span className="text-white text-xs font-bold bg-black/40 px-4 py-2 rounded-full border border-white/20">Change Photo</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-300 mb-4 block"></i>
                              <p className="text-xs font-bold text-gray-400">Click to upload image</p>
                            </div>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Price (IDR)</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-300">IDR</span>
                          <input name="price" type="number" defaultValue={editingProduct?.price} required className="w-full pl-16 pr-8 py-5 rounded-full bg-slate-50 border-none outline-none focus:ring-2 ring-rose-200 text-lg font-bold shadow-inner" placeholder="0" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Category</label>
                       <select name="category" defaultValue={editingProduct?.category} className="w-full px-8 py-5 rounded-full bg-slate-50 border-none outline-none focus:ring-2 ring-rose-200 appearance-none font-bold text-slate-600 shadow-inner">
                          <option>Classic</option>
                          <option>Modern</option>
                          <option>Luxury</option>
                          <option>Event</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Name (EN)</label>
                       <input name="name_en" defaultValue={editingProduct?.name[Language.EN]} required className="w-full px-8 py-5 rounded-full bg-slate-50 border-none outline-none focus:ring-2 ring-rose-200 font-bold shadow-inner" placeholder="Midnight Silk" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Name (ID)</label>
                       <input name="name_id" defaultValue={editingProduct?.name[Language.ID]} required className="w-full px-8 py-5 rounded-full bg-slate-50 border-none outline-none focus:ring-2 ring-rose-200 font-bold shadow-inner" placeholder="Sutra Malam" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Details (EN)</label>
                       <textarea name="desc_en" defaultValue={editingProduct?.description[Language.EN]} className="w-full px-8 py-5 rounded-[2.5rem] bg-slate-50 border-none outline-none focus:ring-2 ring-rose-200 leading-relaxed shadow-inner" rows={3} placeholder="Crafted with..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Details (ID)</label>
                       <textarea name="desc_id" defaultValue={editingProduct?.description[Language.ID]} className="w-full px-8 py-5 rounded-[2.5rem] bg-slate-50 border-none outline-none focus:ring-2 ring-rose-200 leading-relaxed shadow-inner" rows={3} placeholder="Dibuat dengan..." />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-full font-black text-lg shadow-2xl hover:bg-rose-500 transition-all hover:-translate-y-1 active:scale-95">Save to Collection</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 mt-20 relative overflow-hidden border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 relative z-10">
          <div className="col-span-1 lg:col-span-2">
            <div className="mb-8"><Logo size="h-16 w-16" /></div>
            <p className="text-slate-400 max-w-sm text-lg leading-relaxed">Your professional partner for premium floral experiences in Jakarta. Designing moments that last forever.</p>
          </div>
          <div>
            <h4 className="font-black mb-8 text-rose-500 uppercase tracking-widest text-[10px]">Quick Access</h4>
            <div className="flex flex-col gap-5 text-slate-400 font-bold text-sm">
              <button onClick={() => setActivePage('home')} className="text-left hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-house-chimney text-[10px] opacity-50"></i> Studio Home</button>
              <button onClick={() => setActivePage('products')} className="text-left hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-images text-[10px] opacity-50"></i> Gallery</button>
              <button onClick={() => setActivePage('order')} className="text-left hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-paper-plane text-[10px] opacity-50"></i> Reserve Now</button>
              <button onClick={() => setActivePage('admin')} className="text-left hover:text-rose-400 transition-colors pt-4 border-t border-slate-800 flex items-center gap-2"><i className="fa-solid fa-lock text-[10px] opacity-50"></i> Admin Portal</button>
            </div>
          </div>
          <div>
            <h4 className="font-black mb-8 text-rose-500 uppercase tracking-widest text-[10px]">Connect</h4>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/yourpetalsfriend/" target="_blank" className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-tr from-pink-500 to-yellow-500 transition-all shadow-lg active:scale-90"><i className="fa-brands fa-instagram text-xl"></i></a>
              <a href="https://www.tiktok.com/@yourpetalsfriend.id" target="_blank" className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-black transition-all shadow-lg active:scale-90"><i className="fa-brands fa-tiktok text-xl"></i></a>
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-green-600 transition-all shadow-lg active:scale-90"><i className="fa-brands fa-whatsapp text-xl"></i></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-16 border-t border-slate-800 mt-20 text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] flex justify-center text-center">
          <span>&copy; 2026 Your Petals Friend. Jakarta, Indonesia.</span>
        </div>
      </footer>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white text-slate-900 px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-center gap-6 border border-rose-100 max-w-md animate-in zoom-in-90 duration-500">
              <div className="h-24 w-24 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-200 animate-bounce">
                 <i className="fa-solid fa-check text-5xl"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-serif text-slate-900">Recorded!</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {t.successMsg}
                </p>
              </div>
              <button 
                onClick={() => {setShowSuccess(false); setActivePage('home');}}
                className="mt-4 bg-slate-900 text-white px-12 py-4 rounded-full font-bold shadow-xl hover:bg-rose-500 transition-all active:scale-95"
              >
                Return to Gallery
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
