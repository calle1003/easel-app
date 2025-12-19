interface HeroSectionProps {
  subtitle?: string;
  title: string;
  description?: string;
}

export function HeroSection({
  subtitle,
  title,
  description,
}: HeroSectionProps) {
  return (
    <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
      <div className="max-w-3xl mx-auto text-center">
        {subtitle && <p className="section-subtitle mb-4">{subtitle}</p>}
        <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-slate-600 leading-relaxed">{description}</p>
        )}
      </div>
    </section>
  );
}

