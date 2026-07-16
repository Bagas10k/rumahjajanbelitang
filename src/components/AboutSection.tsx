import React from 'react';
import { MapPin, Phone, Clock, Award, Truck, ShieldCheck } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const features = [
    {
      icon: Award,
      title: 'Resep Turun-Temurun',
      desc: 'Diracik dengan resep tradisional khas Belitang yang sudah terjaga kualitasnya selama puluhan tahun.'
    },
    {
      icon: ShieldCheck,
      title: 'Bahan Pilihan',
      desc: 'Hanya menggunakan bahan-bahan segar berkualitas tinggi tanpa pengawet berbahaya.'
    },
    {
      icon: Truck,
      title: 'Pengiriman Aman',
      desc: 'Dikemas dengan rapi dan aman untuk menjaga kerenyahan sampai di tangan Anda.'
    }
  ];

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full mb-4">
          <span className="w-2 h-2 bg-[#e28743] rounded-full animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-[#e28743] uppercase tracking-widest">Tentang Kami</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-[#2d2218] tracking-tight mb-4 font-serif">
          Pusat Krupuk <span className="text-[#e28743]">Belitang</span>
        </h2>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          Kami adalah produsen krupuk asli Belitang, OKU Timur, Sumatera Selatan yang telah 
          memproduksi dan menjual krupuk berkualitas tinggi dengan cita rasa tradisional yang autentik.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-orange-50 text-[#e28743] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#e28743] group-hover:text-white transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#2d2218] text-sm mb-2">{feature.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-8">
        <h3 className="text-sm font-black text-[#2d2218] uppercase tracking-widest mb-6 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#e28743]" />
          Informasi Kontak
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#e28743]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Alamat</span>
              <span className="text-xs text-gray-700 font-medium leading-relaxed">
                Belitang, OKU Timur,<br />Sumatera Selatan, Indonesia
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#e28743]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Telepon / WhatsApp</span>
              <span className="text-xs text-gray-700 font-medium">+62 812-XXXX-XXXX</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#e28743]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Jam Operasional</span>
              <span className="text-xs text-gray-700 font-medium">
                Senin - Sabtu: 08.00 - 17.00 WIB<br />
                Minggu: Libur
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
