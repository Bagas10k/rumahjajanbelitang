import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { ShoppingBag, User, LogOut, LayoutDashboard } from 'lucide-react';

export interface NavbarProps {
  onCartToggle?: () => void;
  onLoginClick?: () => void;
  onDashboardToggle?: () => void;
  isAdminViewActive?: boolean;
  activePage: 'catalog' | 'status';
  onPageChange?: (page: 'catalog' | 'status') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onCartToggle, 
  onLoginClick,
  onDashboardToggle,
  isAdminViewActive,
  activePage,
  onPageChange
}) => {
  const cartItemsCount = useCartStore((state) => state.getCartItemsCount());
  const currentUser = useCartStore((state) => state.currentUser);
  const logout = useCartStore((state) => state.logout);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onPageChange?.('catalog')}>
          <div className="w-10 h-10 bg-[#e28743] rounded-full border-2 border-[#c97435] flex items-center justify-center shadow-xs">
            <span className="text-white text-xs font-black tracking-wider">PKB</span>
          </div>
          <span className="text-lg font-bold text-[#2d2218] hidden sm:block font-serif">
            Pusat Krupuk Belitang
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="hidden md:block">
          <ul className="flex gap-8 text-sm font-semibold">
            <li 
              onClick={() => onPageChange?.('catalog')}
              className={`relative py-1 cursor-pointer transition-colors ${!isAdminViewActive && activePage === 'catalog' ? 'text-[#2d2218] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Beranda
              {!isAdminViewActive && activePage === 'catalog' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e28743] rounded-full"></span>
              )}
            </li>
            <li 
              onClick={() => onPageChange?.('status')}
              className={`relative py-1 cursor-pointer transition-colors ${!isAdminViewActive && activePage === 'status' ? 'text-[#2d2218] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Cek Status Pesanan
              {!isAdminViewActive && activePage === 'status' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e28743] rounded-full"></span>
              )}
            </li>
            <li className="text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer">
              Kategori
            </li>
            <li className="text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer">
              Tentang Kami
            </li>
          </ul>
        </nav>

        {/* Auth status & actions */}
        <div className="flex items-center gap-4 flex-1 sm:flex-none justify-end">
          
          {/* Dashboard Toggle Link for Admin */}
          {isAdmin && (
            <button
              onClick={onDashboardToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAdminViewActive 
                  ? 'bg-gray-100 text-gray-700' 
                  : 'bg-orange-50 text-[#e28743] hover:bg-orange-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {isAdminViewActive ? 'Lihat Toko' : 'Admin Panel'}
            </button>
          )}

          {/* User Section (Welcome / Login Button) */}
          {currentUser ? (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden xs:block">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
                  {currentUser.role === 'admin' ? 'Administrator' : 'Pelanggan'}
                </span>
                <span className="text-xs font-bold text-gray-700 block truncate max-w-[80px]">
                  {currentUser.username}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  if (isAdminViewActive && onDashboardToggle) {
                    onDashboardToggle(); // switch back to catalog
                  }
                  alert('Anda telah keluar akun.');
                }}
                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-[#2d2218] border border-gray-200 font-bold text-xs rounded-full transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              Login
            </button>
          )}

          {/* Cart Trigger Button (Hidden if in Admin View) */}
          {!isAdminViewActive && (
            <button
              onClick={onCartToggle}
              className="relative p-2 text-[#2d2218] hover:text-[#e28743] bg-gray-50 hover:bg-orange-50 rounded-full transition-all focus:outline-none cursor-pointer"
              aria-label="Buka Keranjang"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#e28743] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {cartItemsCount}
                </span>
              )}
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
