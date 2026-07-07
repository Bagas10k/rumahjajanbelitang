import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, User, ShieldAlert, Lock, UserCheck } from 'lucide-react';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useCartStore();

  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      alert('Silakan masukkan Username dan Password.');
      return;
    }

    // Basic Mock Authentication
    if (role === 'admin' && username === 'admin' && password === 'admin') {
      login('Administrator', 'admin');
      alert('Login Admin Berhasil! Menu Admin Dashboard sekarang terbuka.');
      onClose();
    } else if (role === 'customer') {
      // Allow any customer login for simulation
      login(username, 'customer');
      alert(`Login Berhasil! Selamat datang kembali, ${username}.`);
      onClose();
    } else {
      alert('Kredensial salah! Gunakan username: admin / pass: admin untuk mode Admin.');
    }
  };

  // Prefill helper for instant testing
  const handleQuickLogin = (selectedRole: 'customer' | 'admin') => {
    if (selectedRole === 'admin') {
      setUsername('admin');
      setPassword('admin');
      setRole('admin');
    } else {
      setUsername('Bagas');
      setPassword('customer123');
      setRole('customer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      
      {/* Modal Card */}
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
          <h2 className="text-base font-bold text-[#2d2218] tracking-tight">Login Pengguna</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          
          {/* Role Tabs */}
          <div className="flex bg-[#faf9f6] p-1 rounded-xl border border-gray-100 mb-6">
            <button
              onClick={() => {
                setRole('customer');
                setUsername('');
                setPassword('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                role === 'customer'
                  ? 'bg-white text-[#e28743] shadow-xs'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              onClick={() => {
                setRole('admin');
                setUsername('');
                setPassword('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-[#e28743] shadow-xs'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Administrator
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={role === 'admin' ? "admin" : "Masukkan username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] focus:ring-1 focus:ring-[#e28743]"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] focus:ring-1 focus:ring-[#e28743]"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              {role === 'admin' && (
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Demo Hint: Gunakan user: <b>admin</b> & pass: <b>admin</b>
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-xs transition-colors mt-6"
            >
              Masuk Akun
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="border-t border-gray-100 mt-6 pt-5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-3">
              Mode Cepat untuk Demo
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-600 text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                Demo Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-600 text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                Demo Admin
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
