'use client';

import { CustomerInfo } from '../types';

interface CustomerInfoFormProps {
  data: CustomerInfo;
  onChange: (data: CustomerInfo) => void;
  disabled?: boolean;
}

export function CustomerInfoForm({
  data,
  onChange,
  disabled = false,
}: CustomerInfoFormProps) {
  const handleChange = (field: keyof CustomerInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <section>
      <h2 className="text-xs tracking-wider text-slate-400 mb-4 uppercase">
        お客様情報 <span className="text-red-400">*</span>
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-slate-500 mb-2">
            お名前 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={disabled}
            placeholder="山田 太郎"
            className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-2">
            メールアドレス <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={disabled}
            placeholder="example@email.com"
            className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-400">※チケット情報をお送りします</p>
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-2">
            電話番号 <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={disabled}
            placeholder="090-1234-5678"
            className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}

