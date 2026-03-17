"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { JurisAILogo } from "@/components/ui/jurisai-logo";
import {
  Scale,
  Search,
  FileText,
  Bell,
  ChevronDown,
  ChevronRight,
  Check,
  Shield,
  Lock,
  Globe,
  Zap,
  BookOpen,
  Building2,
  Gavel,
  Star,
  ArrowRight,
  Menu,
  X,
  BarChart3,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ─── Scroll animation hook ────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function AnimateIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}


// ─── Citation chip ─────────────────────────────────────────────────────────────
function CitationChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-2 py-0.5 text-[11px] font-semibold text-[#C9A84C] font-mono mx-0.5">
      {children}
    </span>
  );
}

// ─── Product mockup (Hero) ─────────────────────────────────────────────────────
function InvestigadorMockup() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className={`relative transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      {/* Glow effect */}
      <div className="absolute -inset-4 rounded-2xl bg-[#C9A84C]/5 blur-2xl" />
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#C9A84C]/10 to-transparent blur-lg" />

      {/* Window chrome */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0a1520] shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#07111c] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white/5 px-3 py-1 text-xs text-white/40">
            <Globe className="h-3 w-3" />
            <span>jurisai.com.mx/app/investigador</span>
          </div>
        </div>

        {/* App header bar */}
        <div className="flex items-center justify-between border-b border-white/5 bg-[#0C1B2A] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="text-xs font-semibold text-white/80">Investigador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/40">Federal</span>
            <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/40">Constitucional</span>
          </div>
        </div>

        <div className="p-4 space-y-4 min-h-[340px]">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-[#C9A84C]/15 border border-[#C9A84C]/20 px-3 py-2">
              <p className="text-xs text-white/90">
                ¿Cuáles son los requisitos para interponer un amparo indirecto?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 mt-0.5">
              <Sparkles className="h-3 w-3 text-[#C9A84C]" />
            </div>
            <div className="flex-1 space-y-2.5">
              <div className="rounded-xl rounded-tl-sm bg-white/5 border border-white/10 px-3 py-2.5">
                <p className="text-[11px] leading-relaxed text-white/80">
                  El amparo indirecto procede según{" "}
                  <CitationChip>[Art. 107 LA]</CitationChip> cuando se reclaman
                  actos de autoridad fuera de juicio. Los requisitos son:
                </p>
                <ol className="mt-2 space-y-1 text-[11px] text-white/70 list-none">
                  <li className="flex gap-1.5"><span className="text-[#C9A84C] font-bold">I.</span>Existencia de un acto de autoridad que viole garantías constitucionales <CitationChip>[Art. 1 CPEUM]</CitationChip></li>
                  <li className="flex gap-1.5"><span className="text-[#C9A84C] font-bold">II.</span>Principio de agravio personal y directo <CitationChip>[Art. 61 LA]</CitationChip></li>
                  <li className="flex gap-1.5"><span className="text-[#C9A84C] font-bold">III.</span>Definitividad del acto reclamado</li>
                </ol>
              </div>
              {/* Confidence badge */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  CONFIANZA: ALTA
                </span>
                <span className="text-[10px] text-white/30">3 fuentes verificadas</span>
              </div>
              {/* Follow-up pills */}
              <div className="flex flex-wrap gap-1.5">
                <span className="cursor-pointer rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-2 py-0.5 text-[10px] text-[#C9A84C]/80 hover:bg-[#C9A84C]/10 transition-colors">
                  ¿Plazo para presentarlo? →
                </span>
                <span className="cursor-pointer rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-2 py-0.5 text-[10px] text-[#C9A84C]/80 hover:bg-[#C9A84C]/10 transition-colors">
                  ¿Suspensión del acto? →
                </span>
              </div>
            </div>
          </div>

          {/* Typing input */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 mt-auto">
            <span className="flex-1 text-[11px] text-white/30">Escribe tu consulta jurídica...</span>
            <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/20">⌘↵</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing card ──────────────────────────────────────────────────────────────
interface PricingCardProps {
  name: string;
  price: number | null;
  priceLabel?: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlighted?: boolean;
  badge?: string;
  annual: boolean;
}

function PricingCard({ name, price, priceLabel, description, features, cta, ctaLink, highlighted, badge, annual }: PricingCardProps) {
  const displayPrice = price !== null && annual ? Math.round(price * 0.8) : price;

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
      highlighted
        ? "border-[#C9A84C]/50 bg-[#C9A84C]/5 shadow-lg shadow-[#C9A84C]/10"
        : "border-white/10 bg-white/3 hover:border-white/20"
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-bold text-[#0C1B2A]">
            {badge}
          </span>
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        <p className="mt-1 text-sm text-white/50">{description}</p>
      </div>
      <div className="mb-6">
        {price !== null ? (
          <div className="flex items-end gap-1">
            <span className="font-serif text-4xl font-bold text-white">
              ${displayPrice?.toLocaleString("es-MX")}
            </span>
            <span className="mb-1 text-sm text-white/50">MXN/mes</span>
          </div>
        ) : (
          <span className="font-serif text-2xl font-bold text-white">{priceLabel}</span>
        )}
        {annual && price !== null && (
          <p className="mt-1 text-xs text-[#C9A84C]">20% de descuento anual</p>
        )}
        <p className="mt-1 text-xs text-white/40">Prueba gratis 14 días • Sin tarjeta</p>
      </div>
      <ul className="mb-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/70">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaLink}
        className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
          highlighted
            ? "bg-[#C9A84C] text-[#0C1B2A] hover:bg-[#d4ad55] shadow-md shadow-[#C9A84C]/20"
            : "border border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      className="w-full text-left border-b border-white/10 py-5 group"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-base font-semibold text-white group-hover:text-[#C9A84C] transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-sm leading-relaxed text-white/60">{answer}</p>
      </div>
    </button>
  );
}

// ─── Main landing page ─────────────────────────────────────────────────────────
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  const modules = [
    {
      icon: Search,
      title: "Investigador",
      subtitle: "Investigación jurídica con IA",
      description:
        "Formula consultas en lenguaje natural y obtén respuestas con citas verificadas a códigos, jurisprudencia SCJN y reglamentos. Cada afirmación está respaldada por una fuente.",
      features: ["Citas a CCF, CPEUM, LFT y más", "Jurisprudencia SCJN verificada", "Indicador de confianza Alta/Media/Baja", "Preguntas sugeridas automáticas"],
      color: "from-blue-500/20 to-blue-600/5",
      accentColor: "text-blue-400",
    },
    {
      icon: FileText,
      title: "Redactor",
      subtitle: "Redacción de documentos legales",
      description:
        "Genera contratos, amparos, actas y escritos en español jurídico mexicano impecable. El asistente de IA sugiere cláusulas, completa variables y verifica referencias legales.",
      features: ["10+ plantillas del sistema", "Español jurídico formal", "Editor TipTap integrado", "Exportación a DOCX/PDF"],
      color: "from-emerald-500/20 to-emerald-600/5",
      accentColor: "text-emerald-400",
    },
    {
      icon: Bell,
      title: "Cumplimiento",
      subtitle: "Monitoreo regulatorio en tiempo real",
      description:
        "Vigilancia automatizada del DOF, SAT, IMSS y COFEPRIS. Alertas clasificadas por área del derecho e impacto, con análisis de cómo cada cambio afecta tus asuntos activos.",
      features: ["Monitoreo diario del DOF", "Alertas SAT, IMSS, COFEPRIS", "Análisis de impacto por asunto", "Calendario de cumplimiento"],
      color: "from-amber-500/20 to-amber-600/5",
      accentColor: "text-amber-400",
    },
  ];

  const differentiators = [
    { icon: BookOpen, title: "32 códigos estatales + federal", desc: "Cobertura completa del sistema jurídico mexicano, desde la CPEUM hasta los códigos estatales de CDMX, JAL, NL y EDOMEX." },
    { icon: Gavel, title: "Jurisprudencia SCJN verificada", desc: "Base de datos de jurisprudencia y tesis aisladas actualizada. Distingue automáticamente entre criterios vinculantes y orientadores." },
    { icon: Scale, title: "Amparos y derecho constitucional", desc: "Especialización en la Ley de Amparo, criterios de constitucionalidad y cadena jerárquica Constitución → Ley → Reglamento." },
    { icon: BarChart3, title: "Cumplimiento SAT, IMSS, COFEPRIS", desc: "Vigilancia de las autoridades regulatorias más relevantes para empresas y despachos con práctica fiscal, laboral y sanitaria." },
    { icon: Globe, title: "Bilingüe: español ↔ inglés", desc: "Diseñado para asuntos transfronterizos y negocios internacionales. Documentos y consultas en ambos idiomas, citas siempre en el idioma original." },
    { icon: Building2, title: "Sistema notarial mexicano", desc: "Soporte para actos notariales: poderes, actas constitutivas, compraventas inmobiliarias y formalización ante fedatario público." },
  ];

  const pricingTiers = [
    {
      name: "PyME",
      price: 499,
      description: "Para empresas y negocios con necesidades legales básicas",
      features: ["30 consultas/mes", "5 documentos/mes", "Plantillas del sistema", "Soporte por email"],
      cta: "Comenzar gratis",
      ctaLink: "/register",
    },
    {
      name: "Básico",
      price: 1499,
      description: "Para abogados independientes y consultores",
      features: ["100 consultas/mes", "20 documentos/mes", "Todas las plantillas", "1 usuario", "Exportación DOCX/PDF", "Soporte prioritario"],
      cta: "Comenzar gratis",
      ctaLink: "/register",
    },
    {
      name: "Profesional",
      price: 2999,
      description: "Para despachos medianos y equipos jurídicos",
      features: ["500 consultas/mes", "Documentos ilimitados", "Hasta 10 usuarios", "Gestión de asuntos", "Alertas de cumplimiento", "API access", "Soporte dedicado"],
      cta: "Comenzar gratis",
      ctaLink: "/register",
      highlighted: true,
      badge: "Más popular",
    },
    {
      name: "Empresa",
      price: null,
      priceLabel: "A medida",
      description: "Para grandes despachos y áreas legales corporativas",
      features: ["Consultas ilimitadas", "Usuarios ilimitados", "SSO empresarial", "SLA garantizado", "Integración API completa", "Onboarding dedicado", "Factura en MXN/USD"],
      cta: "Contactar ventas",
      ctaLink: "/register",
    },
  ];

  const faqs = [
    {
      question: "¿Qué tan preciso es JurisAI?",
      answer: "JurisAI utiliza verificación de citas en tiempo real contra nuestra base de fuentes jurídicas indexadas. Cada respuesta incluye un indicador de confianza (Alta/Media/Baja) basado en el porcentaje de citas verificadas. Las citas doradas son verificadas; las grises, no encontradas en nuestra base. Recomendamos siempre validar con el texto oficial para decisiones críticas.",
    },
    {
      question: "¿JurisAI reemplaza a un abogado?",
      answer: "No. JurisAI es una herramienta de investigación y redacción para profesionales del derecho. Acelera la investigación jurídica, automatiza la redacción de borradores y monitorea cambios regulatorios — pero el criterio profesional, la estrategia legal y la responsabilidad ante el cliente siguen siendo del abogado.",
    },
    {
      question: "¿Mis documentos y consultas son confidenciales?",
      answer: "Sí. Tus datos están cifrados con AES-256, aislados por organización y nunca utilizados para entrenar modelos de IA. Cumplimos con la Ley Federal de Protección de Datos Personales (LFPDPPP). El hosting está en infraestructura en México y LATAM.",
    },
    {
      question: "¿Cubre derecho estatal o solo federal?",
      answer: "Actualmente cubre legislación federal completa más los estados con mayor actividad jurídica: Ciudad de México, Jalisco, Nuevo León y Estado de México. Estamos expandiendo a los 32 estados durante 2025.",
    },
    {
      question: "¿Puedo cancelar en cualquier momento?",
      answer: "Sí. No hay contratos de permanencia. Puedes cancelar desde el panel de facturación y tu acceso continúa hasta el final del período pagado. Para planes anuales, ofrecemos reembolso proporcional dentro de los primeros 30 días.",
    },
    {
      question: "¿Funciona en inglés para asuntos transfronterizos?",
      answer: "Sí. JurisAI es bilingüe por diseño. Puedes hacer consultas en inglés y recibirás respuestas en el idioma que prefieras, aunque las citas legales siempre aparecen en su idioma original. Ideal para asuntos USMCA/T-MEC y derecho comercial internacional.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0C1B2A] font-sans text-white">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "border-b border-white/10 bg-[#0C1B2A]/95 backdrop-blur-md shadow-lg shadow-black/20" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <JurisAILogo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Producto", id: "modulos" },
              { label: "Cómo funciona", id: "como-funciona" },
              { label: "Precios", id: "precios" },
              { label: "FAQ", id: "faq" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0C1B2A] hover:bg-[#d4ad55] transition-all shadow-md shadow-[#C9A84C]/20"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-lg p-2 text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0C1B2A]/98 px-4 pb-4 pt-2">
            {[
              { label: "Producto", id: "modulos" },
              { label: "Cómo funciona", id: "como-funciona" },
              { label: "Precios", id: "precios" },
              { label: "FAQ", id: "faq" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full py-2.5 text-left text-sm text-white/70 hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-3 flex gap-2">
              <Link href="/login" className="flex-1 rounded-xl border border-white/20 py-2 text-center text-sm text-white/80">
                Iniciar sesión
              </Link>
              <Link href="/register" className="flex-1 rounded-xl bg-[#C9A84C] py-2 text-center text-sm font-semibold text-[#0C1B2A]">
                Comenzar gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C1B2A]/50 to-[#0C1B2A]" />
        {/* Gold orb */}
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#C9A84C]/4 blur-[120px]" />
        <div className="absolute left-1/4 bottom-1/3 h-[300px] w-[300px] rounded-full bg-blue-500/3 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] mb-6 opacity-0 animate-[fadeInDown_0.6s_ease_0.1s_forwards]"
                style={{ animationFillMode: "forwards" }}
              >
                <Star className="h-3 w-3 fill-[#C9A84C]" />
                Inteligencia Legal para México
              </div>

              <h1
                className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.5rem] xl:text-6xl opacity-0"
                style={{ animation: "fadeInDown 0.7s ease 0.2s forwards" }}
              >
                Tu Copiloto Legal con{" "}
                <span className="text-[#C9A84C]">Inteligencia Artificial</span>
              </h1>

              <p
                className="mt-6 text-lg leading-relaxed text-white/60 opacity-0"
                style={{ animation: "fadeInDown 0.7s ease 0.35s forwards" }}
              >
                Investigación jurídica, redacción de documentos y cumplimiento
                regulatorio — impulsados por IA, diseñados para el derecho
                mexicano.
              </p>

              <div
                className="mt-8 flex flex-col gap-3 sm:flex-row opacity-0"
                style={{ animation: "fadeInDown 0.7s ease 0.5s forwards" }}
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-6 py-3.5 text-sm font-bold text-[#0C1B2A] hover:bg-[#d4ad55] transition-all shadow-xl shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/35 hover:-translate-y-0.5"
                >
                  Comenzar Prueba Gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => scrollTo("modulos")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/5 hover:border-white/30 transition-all"
                >
                  Ver producto
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div
                className="mt-8 flex items-center gap-6 opacity-0"
                style={{ animation: "fadeInDown 0.7s ease 0.65s forwards" }}
              >
                {[
                  { value: "32+", label: "códigos y leyes" },
                  { value: "14 días", label: "prueba gratis" },
                  { value: "2s", label: "primera respuesta" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="font-serif text-xl font-bold text-[#C9A84C]">{stat.value}</div>
                    <div className="text-xs text-white/40">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product mockup */}
            <div className="lg:pl-4">
              <InvestigadorMockup />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <span className="text-xs text-white/60">Descubrir</span>
          <ChevronDown className="h-4 w-4 text-white animate-bounce" />
        </div>
      </section>

      {/* ── Trusted By ──────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/2 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
            Utilizado por despachos líderes en México
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {["Despacho Martínez & Asociados", "Corporativo Legal MX", "Bufete Innovación", "LexTech CDMX", "Notaría Digital", "Abogados Unidos"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 opacity-25 grayscale hover:opacity-50 hover:grayscale-0 transition-all duration-300"
              >
                <div className="h-6 w-6 rounded bg-white/20" />
                <span className="text-sm font-semibold text-white/60 whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem statement ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              El problema
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl max-w-3xl mx-auto leading-tight">
              Los abogados mexicanos pasan{" "}
              <span className="text-[#C9A84C]">60% de su tiempo</span> en tareas que la IA puede resolver
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Investigación manual",
                desc: "Horas buscando en el Código Civil, jurisprudencia SCJN y DOF sin garantía de encontrar la fuente correcta o la reforma más reciente.",
                stat: "4+ horas",
                statLabel: "por consulta típica",
              },
              {
                icon: FileText,
                title: "Redacción repetitiva",
                desc: "Los mismos contratos redactados desde cero o adaptados manualmente de versiones anteriores, con riesgo de errores y cláusulas desactualizadas.",
                stat: "80%",
                statLabel: "de contratos son similares",
              },
              {
                icon: AlertCircle,
                title: "Laberinto regulatorio",
                desc: "32 estados × legislación federal = más de 800 fuentes de derecho. SAT, IMSS, COFEPRIS actualizan normas constantemente.",
                stat: "2,400+",
                statLabel: "reformas al DOF en 2024",
              },
            ].map((item, i) => (
              <AnimateIn key={item.title} delay={i * 120}>
                <div className="rounded-2xl border border-white/8 bg-white/3 p-6 h-full hover:border-white/15 transition-colors">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                    <item.icon className="h-5 w-5 text-[#C9A84C]" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50 mb-4">{item.desc}</p>
                  <div className="border-t border-white/8 pt-4">
                    <div className="font-serif text-2xl font-bold text-[#C9A84C]">{item.stat}</div>
                    <div className="text-xs text-white/40">{item.statLabel}</div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three Modules ─────────────────────────────────────────────── */}
      <section id="modulos" className="py-24 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              La plataforma
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Todo lo que tu despacho necesita
            </h2>
          </AnimateIn>

          {/* Module tabs */}
          <div className="flex gap-2 justify-center mb-10 flex-wrap">
            {modules.map((m, i) => (
              <button
                key={m.title}
                onClick={() => setActiveModule(i)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeModule === i
                    ? "bg-[#C9A84C] text-[#0C1B2A] shadow-lg shadow-[#C9A84C]/20"
                    : "border border-white/15 text-white/60 hover:text-white hover:border-white/25"
                }`}
              >
                <m.icon className="h-4 w-4" />
                {m.title}
              </button>
            ))}
          </div>

          {/* Active module card */}
          {modules.map((m, i) => (
            <div
              key={m.title}
              className={`transition-all duration-400 ${activeModule === i ? "opacity-100 block" : "opacity-0 hidden"}`}
            >
              <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${m.color} p-8 md:p-12`}>
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 items-center">
                  <div>
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15`}>
                      <m.icon className={`h-6 w-6 ${m.accentColor}`} />
                    </div>
                    <h3 className="font-serif text-3xl font-bold text-white mb-2">{m.title}</h3>
                    <p className="text-sm font-semibold text-white/40 uppercase tracking-wide mb-4">{m.subtitle}</p>
                    <p className="text-base leading-relaxed text-white/70 mb-6">{m.description}</p>
                    <ul className="space-y-2.5 mb-8">
                      {m.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                          <Check className={`h-4 w-4 shrink-0 ${m.accentColor}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/register"
                      className={`inline-flex items-center gap-2 text-sm font-semibold ${m.accentColor} hover:opacity-80 transition-opacity`}
                    >
                      Explorar {m.title} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Module mockup */}
                  <div className="relative">
                    <div className="rounded-2xl border border-white/10 bg-[#07111c] p-5 shadow-2xl">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                        </div>
                        <div className="flex-1 rounded bg-white/5 h-5 flex items-center px-2">
                          <span className="text-[10px] text-white/25">JurisAI — {m.title}</span>
                        </div>
                      </div>
                      {i === 0 && (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-white/5 p-3 text-[11px] text-white/60">
                            ¿Cuál es la responsabilidad civil por daño moral en México?
                          </div>
                          <div className="rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-3 text-[11px] text-white/70 space-y-1.5">
                            <p>El daño moral se regula en <CitationChip>[Art. 1916 CCF]</CitationChip> y su reparación en <CitationChip>[Art. 1916-bis CCF]</CitationChip>.</p>
                            <p className="text-white/50">El monto de la indemnización queda al prudente arbitrio del juez...</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />CONFIANZA: ALTA
                          </span>
                        </div>
                      )}
                      {i === 1 && (
                        <div className="space-y-2">
                          <div className="rounded bg-white/5 h-2 w-3/4" />
                          <div className="rounded bg-white/5 h-2 w-full" />
                          <div className="rounded bg-white/5 h-2 w-5/6" />
                          <div className="mt-3 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-3 text-[11px] text-white/60">
                            <p className="font-bold text-[#C9A84C] text-[10px] mb-1">CLÁUSULA PRIMERA. OBJETO.</p>
                            <p>EL ARRENDADOR da en arrendamiento a EL ARRENDATARIO el inmueble ubicado en...</p>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <div className="flex-1 rounded bg-[#C9A84C]/20 h-6 flex items-center justify-center text-[10px] text-[#C9A84C] font-semibold">Exportar DOCX</div>
                            <div className="flex-1 rounded bg-white/5 h-6" />
                          </div>
                        </div>
                      )}
                      {i === 2 && (
                        <div className="space-y-2">
                          {[
                            { auth: "SAT", level: "ALTO", title: "Reforma a la LISR: cambios en ISR personas morales", color: "bg-red-500/10 border-red-500/20 text-red-400" },
                            { auth: "IMSS", level: "MEDIO", title: "Actualización SBC para determinación de cuotas", color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
                            { auth: "DOF", level: "BAJO", title: "NOM-035-STPS-2018: próxima revisión quinquenal", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                          ].map((alert) => (
                            <div key={alert.title} className={`rounded-lg border ${alert.color.split(" ")[1]} bg-white/3 p-2.5 flex items-start gap-2`}>
                              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${alert.color}`}>{alert.auth}</span>
                              <p className="text-[10px] text-white/60">{alert.title}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              Cómo funciona
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Resultados en tres pasos
            </h2>
          </AnimateIn>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-12 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent hidden md:block" />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Haz tu consulta",
                  desc: "Formula cualquier pregunta legal en lenguaje natural. Español o inglés, simple o técnica — JurisAI entiende el contexto jurídico mexicano.",
                  icon: Search,
                },
                {
                  number: "02",
                  title: "JurisAI investiga",
                  desc: "La IA busca en miles de artículos de códigos, jurisprudencia SCJN verificada y regulaciones actualizadas del DOF, SAT e IMSS.",
                  icon: Zap,
                },
                {
                  number: "03",
                  title: "Obtén respuestas verificadas",
                  desc: "Cada afirmación viene con cita exacta al artículo correspondiente, indicador de confianza y preguntas sugeridas para profundizar.",
                  icon: Check,
                },
              ].map((step, i) => (
                <AnimateIn key={step.number} delay={i * 150}>
                  <div className="relative flex flex-col items-center text-center p-6">
                    <div className="relative mb-6">
                      <div className="h-24 w-24 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-[#C9A84C]" />
                      </div>
                      <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C] text-[11px] font-bold text-[#0C1B2A]">
                        {step.number.slice(1)}
                      </div>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>

          <AnimateIn className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-8 py-4 text-sm font-bold text-[#0C1B2A] hover:bg-[#d4ad55] transition-all shadow-xl shadow-[#C9A84C]/20 hover:-translate-y-0.5"
            >
              Probar ahora — es gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── Built for Mexican Law ─────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              Diseñado para México
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl max-w-2xl mx-auto">
              No es un producto genérico adaptado. Es derecho mexicano nativo.
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80}>
                <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/3 transition-all duration-300 h-full">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/8 group-hover:bg-[#C9A84C]/15 transition-colors">
                    <item.icon className="h-5 w-5 text-[#C9A84C]" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{item.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="precios" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              Precios
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl mb-4">
              Transparente. En pesos mexicanos.
            </h2>
            <p className="text-white/50 mb-8">Todos los planes incluyen 14 días de prueba gratis. Sin tarjeta de crédito.</p>

            {/* Monthly / Annual toggle */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${!annual ? "bg-[#C9A84C] text-[#0C1B2A] shadow-sm" : "text-white/50 hover:text-white"}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${annual ? "bg-[#C9A84C] text-[#0C1B2A] shadow-sm" : "text-white/50 hover:text-white"}`}
              >
                Anual
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${annual ? "bg-[#0C1B2A]/20 text-[#0C1B2A]" : "bg-[#C9A84C]/20 text-[#C9A84C]"}`}>
                  -20%
                </span>
              </button>
            </div>
          </AnimateIn>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {pricingTiers.map((tier, i) => (
              <AnimateIn key={tier.name} delay={i * 80}>
                <PricingCard {...tier} annual={annual} />
              </AnimateIn>
            ))}
          </div>

          {/* Feature comparison note */}
          <AnimateIn className="mt-10 text-center">
            <p className="text-sm text-white/40">
              ¿Necesitas comparar planes en detalle?{" "}
              <button
                onClick={() => scrollTo("faq")}
                className="text-[#C9A84C] hover:underline"
              >
                Ver preguntas frecuentes
              </button>{" "}
              o{" "}
              <a href="mailto:hola@jurisai.com.mx" className="text-[#C9A84C] hover:underline">
                contactarnos
              </a>
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Security ──────────────────────────────────────────────────── */}
      <section className="py-20 border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              Seguridad
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              Tus datos están protegidos
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              JurisAI nunca usa tus consultas o documentos para entrenar modelos de IA. Tu información es tuya.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { icon: Lock, title: "Cifrado AES-256", desc: "Todos los datos en reposo y tránsito cifrados con AES-256" },
              { icon: Shield, title: "LFPDPPP Compliant", desc: "Cumplimiento con la Ley Federal de Protección de Datos Personales" },
              { icon: Globe, title: "Hosting en México/LATAM", desc: "Infraestructura con residencia de datos en México y América Latina" },
              { icon: Zap, title: "Zero data retention", desc: "Las consultas a IA no se retienen ni usan para entrenamiento de modelos" },
            ].map((badge, i) => (
              <AnimateIn key={badge.title} delay={i * 100}>
                <div className="flex flex-col items-center text-center rounded-2xl border border-white/8 bg-white/3 p-6 h-full hover:border-white/15 transition-colors">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/8">
                    <badge.icon className="h-6 w-6 text-[#C9A84C]" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">{badge.title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{badge.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AnimateIn className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
              FAQ
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              Preguntas frecuentes
            </h2>
          </AnimateIn>

          <AnimateIn>
            <div className="divide-y divide-white/0">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} {...faq} />
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/8 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #C9A84C 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/8 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] mb-6">
              <Star className="h-3 w-3 fill-[#C9A84C]" />
              Sin tarjeta de crédito · 14 días gratis
            </div>
            <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl mb-6 leading-tight">
              Transforma tu práctica legal hoy
            </h2>
            <p className="text-lg text-white/55 mb-10 max-w-xl mx-auto">
              Únete a los despachos que ya usan IA para investigar más rápido, redactar mejor y mantener el cumplimiento sin esfuerzo.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-3 rounded-2xl bg-[#C9A84C] px-10 py-4 text-base font-bold text-[#0C1B2A] hover:bg-[#d4ad55] transition-all shadow-2xl shadow-[#C9A84C]/30 hover:-translate-y-1 hover:shadow-[#C9A84C]/40"
            >
              Crear Cuenta Gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-xs text-white/35">Sin tarjeta de crédito · 14 días de prueba · Cancela cuando quieras</p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 bg-[#07111c] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-5 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <JurisAILogo />
              <p className="mt-3 text-xs leading-relaxed text-white/40 max-w-xs">
                Inteligencia Legal para México. Investigación, redacción y cumplimiento — todo en un solo lugar.
              </p>
              <div className="mt-4 flex gap-3">
                <a href="#" className="text-white/30 hover:text-white/70 transition-colors text-xs">LinkedIn</a>
                <a href="#" className="text-white/30 hover:text-white/70 transition-colors text-xs">X / Twitter</a>
              </div>
            </div>

            {/* Links */}
            {[
              { title: "Producto", links: [{ label: "Investigador", href: "/register" }, { label: "Redactor", href: "/register" }, { label: "Cumplimiento", href: "/register" }, { label: "Precios", href: "#precios" }] },
              { title: "Empresa", links: [{ label: "Blog", href: "#" }, { label: "Soporte", href: "#" }, { label: "API Docs", href: "#" }, { label: "Contacto", href: "mailto:hola@jurisai.com.mx" }] },
              { title: "Legal", links: [{ label: "Aviso de Privacidad", href: "#" }, { label: "Términos de Servicio", href: "#" }, { label: "Cookies", href: "#" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">Contacto</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:hola@jurisai.com.mx" className="text-sm text-white/50 hover:text-white transition-colors">
                    hola@jurisai.com.mx
                  </a>
                </li>
                <li className="text-sm text-white/50">Ciudad de México, México</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} JurisAI. Todos los derechos reservados.
            </p>
            <p className="text-xs text-white/30">
              Hecho en México 🇲🇽
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
