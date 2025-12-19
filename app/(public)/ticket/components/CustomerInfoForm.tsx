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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">購入者情報</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={disabled}
            placeholder="山田 太郎"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={disabled}
            placeholder="example@email.com"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            チケット情報をこちらのメールアドレスに送信します
          </p>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={disabled}
            placeholder="090-1234-5678"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
          />
        </div>
      </div>
    </div>
  );
}

