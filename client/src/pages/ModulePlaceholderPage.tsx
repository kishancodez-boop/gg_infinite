import { ArrowLeft, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModulePlaceholderPageProps {
  title: string;
  description: string;
}

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <div className="bg-white border border-[#DCE6DF] rounded-xl p-8 max-w-2xl space-y-4">
      <div className="w-10 h-10 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF] flex items-center justify-center">
        <Construction className="w-5 h-5 text-[#D97706]" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-[#64736B]">
          Milestone 01 Route Shell
        </span>
        <h1 className="text-xl font-semibold text-[#17231F]">{title}</h1>
        <p className="text-sm text-[#64736B] leading-relaxed">{description}</p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#102A25] text-white hover:bg-[#16A36A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Platform Overview
      </Link>
    </div>
  );
}

