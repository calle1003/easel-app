import Link from 'next/link';

export default function TicketCancelPage() {
  return (
    <div className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="section-title mb-8">購入がキャンセルされました</h1>
        <p className="mb-8 text-slate-600">
          チケットの購入がキャンセルされました。<br />
          再度お試しいただくか、お問い合わせください。
        </p>
        <Link href="/easel-live/vol2/ticket" className="btn-primary mr-4">
          購入ページに戻る
        </Link>
        <Link href="/easel-live/vol2" className="btn-secondary">
          公演ページに戻る
        </Link>
      </div>
    </div>
  );
}
