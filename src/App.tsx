import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { OrderStatusPage } from './components/OrderStatusPage';
import { useCartStore } from './store/useCartStore';
import { Star } from 'lucide-react';

function App() {
  // Modal toggle states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any>(null);

  // Page Routing states
  const [activePage, setActivePage] = useState<'catalog' | 'status'>('catalog');
  const [isAdminViewActive, setIsAdminViewActive] = useState(false);

  // Reactive data from Zustand
  const products = useCartStore((state) => state.products);
  const currentUser = useCartStore((state) => state.currentUser);

  const handleDashboardToggle = () => {
    if (currentUser?.role === 'admin') {
      setIsAdminViewActive((prev) => !prev);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedDetailProduct(product);
    setIsDetailOpen(true);
  };

  // Group products into Featured VS Standard lists
  const featuredProducts = products.filter((p) => p.isFeatured);

  return (
    <div className="app-layout min-h-screen flex flex-col bg-[#faf9f6] text-[#2d2218]">
      
      {/* Navbar Header (Always Visible) */}
      <Navbar 
        onCartToggle={() => setIsCartOpen(!isCartOpen)} 
        onLoginClick={() => setIsLoginOpen(true)}
        onDashboardToggle={handleDashboardToggle}
        isAdminViewActive={isAdminViewActive}
        activePage={activePage}
        onPageChange={(page) => {
          setActivePage(page);
          setIsAdminViewActive(false); // Reset admin dashboard view when navigating to client pages
        }}
      />

      {/* Conditionally Render: Admin Dashboard VS Customer Client Views */}
      {isAdminViewActive ? (
        <AdminDashboard onBackToCatalog={() => setIsAdminViewActive(false)} />
      ) : activePage === 'status' ? (
        <OrderStatusPage />
      ) : (
        <>
          {/* Hero Banner Section */}
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
                <button 
                  onClick={() => {
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98"
                >
                  Pesan Sekarang
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-[#2d2218] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Lihat Menu
                </button>
              </div>
            </div>
          </section>

          {/* Storefront Product Catalog Catalog */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-4 space-y-12">
            
            {/* SECTION 1: Featured Products / Produk Unggulan */}
            {featuredProducts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Star className="w-5 h-5 text-[#e28743] fill-[#e28743]" />
                  <h2 className="text-xl font-black text-[#2d2218] tracking-tight">Produk Unggulan</h2>
                  <span className="text-xs text-gray-400 font-medium ml-1">Rekomendasi terlaris kami</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onSelect={handleProductSelect} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: All Products / Semua Menu */}
            <div id="catalog" className="space-y-6 pt-4">
              <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-xl font-black text-[#2d2218] tracking-tight">Semua Pilihan Krupuk</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Koleksi lengkap krupuk Belitang khas nusantara.</p>
                </div>
                <button className="text-[#e28743] font-bold text-xs hover:text-[#c97435] transition-colors flex items-center gap-1 cursor-pointer">
                  Lihat Semua &rarr;
                </button>
              </div>

              {/* All Catalog Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onSelect={handleProductSelect} 
                  />
                ))}
              </div>
            </div>

          </main>
        </>
      )}

      {/* Universal Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6 mt-16 text-xs text-gray-400">
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
            <span className="hover:text-[#e28743] transition-colors cursor-pointer">Hubungi Kami</span>
            <span className="hover:text-[#e28743] transition-colors cursor-pointer">Instagram</span>
            <span className="hover:text-[#e28743] transition-colors cursor-pointer">WhatsApp</span>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Drawer sidebar */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }} 
      />

      {/* Authentication Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      {/* Checkout form panel (address selection, QRIS display, and COD confirm) */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      {/* Detail viewer dialog (gallery + variant pricing + quantity selections) */}
      <ProductDetailModal 
        product={selectedDetailProduct}
        isOpen={isDetailOpen}
        onClose={() => {
          setSelectedDetailProduct(null);
          setIsDetailOpen(false);
        }}
      />

    </div>
  );
}

export default App;
