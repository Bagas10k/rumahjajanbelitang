import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { OrderStatusPage } from './components/OrderStatusPage';
import { AboutSection } from './components/AboutSection';
import { useCartStore } from './store/useCartStore';
import { Star } from 'lucide-react';

type PageType = 'catalog' | 'status' | 'about';

function App() {
  // Modal toggle states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any>(null);

  // Page Routing states
  const [activePage, setActivePage] = useState<PageType>('catalog');
  const [isAdminViewActive, setIsAdminViewActive] = useState(false);

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Reactive data from Zustand
  const products = useCartStore((state) => state.products);
  const currentUser = useCartStore((state) => state.currentUser);
  const fetchProducts = useCartStore((state) => state.fetchProducts);
  const fetchOrders = useCartStore((state) => state.fetchOrders);

  // Hash-based routing
  const navigateTo = useCallback((page: PageType) => {
    setActivePage(page);
    setIsAdminViewActive(false);
    window.location.hash = page === 'catalog' ? '' : page;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'status') setActivePage('status');
      else if (hash === 'about') setActivePage('about');
      else if (hash === 'admin' && currentUser?.role === 'admin') { setActivePage('catalog'); setIsAdminViewActive(true); }
      else setActivePage('catalog');
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const handleDashboardToggle = () => {
    if (currentUser?.role === 'admin') {
      const next = !isAdminViewActive;
      setIsAdminViewActive(next);
      window.location.hash = next ? 'admin' : '';
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedDetailProduct(product);
    setIsDetailOpen(true);
  };

  // Group products
  const featuredProducts = products.filter((p) => p.isFeatured);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const displayProducts = categoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  return (
    <div className="app-layout min-h-screen flex flex-col bg-[#faf9f6] text-[#2d2218]">
      
      {/* Navbar Header */}
      <Navbar 
        onCartToggle={() => setIsCartOpen(!isCartOpen)} 
        onLoginClick={() => setIsLoginOpen(true)}
        onDashboardToggle={handleDashboardToggle}
        isAdminViewActive={isAdminViewActive}
        activePage={activePage}
        onPageChange={navigateTo}
      />

      {/* Main Content */}
      {isAdminViewActive ? (
        <AdminDashboard onBackToCatalog={() => { setIsAdminViewActive(false); window.location.hash = ''; }} />
      ) : activePage === 'status' ? (
        <OrderStatusPage />
      ) : activePage === 'about' ? (
        <AboutSection />
      ) : (
        <>
          {/* Hero Banner */}
          <section className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl py-16 px-6 text-center max-w-4xl mx-auto my-8 shadow-xs w-[calc(100%-2rem)] md:w-full">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e28743_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-[#2d2218] mb-5 tracking-tight leading-tight">
                Krupuk Khas <span className="text-[#e28743]">Belitang</span> Asli
              </h2>
              <p className="text-gray-500 mb-8 text-sm md:text-base leading-relaxed font-medium">
                Renyah, gurih, dan dibuat dengan resep tradisional turun-temurun. Hadirkan kehangatan tradisi dalam setiap gigitan.
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98">
                  Pesan Sekarang
                </button>
                <button onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-[#2d2218] font-bold text-xs rounded-xl transition-colors cursor-pointer">
                  Lihat Menu
                </button>
              </div>
            </div>
          </section>

          {/* Storefront */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-4 space-y-12">
            
            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Star className="w-5 h-5 text-[#e28743] fill-[#e28743]" />
                  <h2 className="text-xl font-black text-[#2d2218] tracking-tight">Produk Unggulan</h2>
                  <span className="text-xs text-gray-400 font-medium ml-1">Rekomendasi terlaris kami</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onSelect={handleProductSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* All Products with Category Filter */}
            <div id="catalog" className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-xl font-black text-[#2d2218] tracking-tight">Semua Pilihan Krupuk</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Koleksi lengkap krupuk Belitang khas nusantara.</p>
                </div>
                {/* Category Filter Chips */}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      categoryFilter === 'all' ? 'bg-[#e28743] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>Semua</button>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setCategoryFilter(cat!)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        categoryFilter === cat ? 'bg-[#e28743] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onSelect={handleProductSelect} />
                ))}
              </div>
              {displayProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm font-semibold">Tidak ada produk dalam kategori ini.</p>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6 mt-16 text-xs text-gray-400 no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e28743] rounded-full border border-[#c97435] flex items-center justify-center shadow-xs">
              <span className="text-white text-[9px] font-black">PKB</span>
            </div>
            <p className="font-medium">
              &copy; {new Date().getFullYear()} Pusat Krupuk Belitang. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6 font-bold">
            <span onClick={() => navigateTo('about')} className="hover:text-[#e28743] transition-colors cursor-pointer">Tentang Kami</span>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e28743] transition-colors cursor-pointer">Instagram</a>
            <a href="https://wa.me/62812XXXXXXXX" target="_blank" rel="noopener noreferrer" className="hover:text-[#e28743] transition-colors cursor-pointer">WhatsApp</a>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} 
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <ProductDetailModal product={selectedDetailProduct} isOpen={isDetailOpen}
        onClose={() => { setSelectedDetailProduct(null); setIsDetailOpen(false); }} />
    </div>
  );
}

export default App;
