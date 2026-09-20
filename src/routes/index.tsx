import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  brand,
  products as initialProducts,
  categories,
  availabilityLabels,
  formatPrice,
  whatsappUrl,
  type Product,
} from "@/data/catalog";
import { fetchProducts, supabase } from "@/lib/catalog-api";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  HandHeart,
  HeartHandshake,
  Instagram,
  MapPin,
  MessageCircle,
  PackageCheck,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const heroImage = "/catalog/product-2.webp";
const lookVestido = "/catalog/product-1.png";
const lookConjunto = "/catalog/product-3.webp";
const lookBlusa = "/catalog/product-4.webp";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vim pelo site e quero atendimento personalizado para escolher minhas peças.")}`;
const INSTAGRAM_URL = "https://instagram.com/_encantofeminino_01";

const trustItems = [
  { icon: HandHeart, label: "Curadoria cuidadosa" },
  { icon: HeartHandshake, label: "Atendimento humano" },
  { icon: PackageCheck, label: "Peças selecionadas" },
  { icon: Clock3, label: "Envio ágil" },
];

const highlights = [
  {
    icon: MessageCircle,
    title: "Atendimento personalizado",
    text: "Indicamos modelos, tamanhos e combinações ideais para cada cliente no WhatsApp.",
  },
  {
    icon: Sparkles,
    title: "Peças selecionadas",
    text: "Uma curadoria feminina com visual delicado, toque confortável e acabamento marcante.",
  },
  {
    icon: ShieldCheck,
    title: "Qualidade premium",
    text: "Tecidos, rendas e detalhes pensados para valorizar conforto, beleza e durabilidade.",
  },
  {
    icon: Check,
    title: "Compra simples",
    text: "Você fala com a marca, tira dúvidas e finaliza seu pedido com atendimento direto e rápido.",
  },
];

const steps = [
  "Escolha sua peça",
  "Fale conosco no WhatsApp",
  "Receba atendimento personalizado",
  "Finalize seu pedido",
  "Receba em casa",
];

const testimonials = [
  {
    name: "Larissa M.",
    photo: lookVestido,
    item: "Vestido Rosé Atelier",
    text: "Fui atendida com muita atenção, consegui acertar o tamanho e a peça chegou linda.",
  },
  {
    name: "Camila R.",
    photo: lookConjunto,
    item: "Conjunto Nude Essenza",
    text: "A experiência foi super próxima e elegante. Parecia atendimento de boutique mesmo.",
  },
  {
    name: "Juliana S.",
    photo: lookBlusa,
    item: "Blusa Vinho Première",
    text: "Tirei todas as dúvidas pelo WhatsApp e finalizei rapidinho. Atendimento impecável.",
  },
];

const faqs = [
  {
    question: "Como comprar?",
    answer:
      "Você escolhe a peça, chama no WhatsApp e recebe atendimento direto para finalizar o pedido com segurança.",
  },
  {
    question: "Como funciona a entrega?",
    answer:
      "Informamos prazo e forma de envio no atendimento. Em alguns casos também há retirada combinada.",
  },
  {
    question: "Como escolher o tamanho?",
    answer:
      "No WhatsApp ajudamos com medidas, modelagem e caimento para indicar a melhor opção para você.",
  },
  {
    question: "Quais formas de pagamento?",
    answer: "As formas disponíveis são informadas no atendimento antes da confirmação do pedido.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Encanto Feminino | Boutique Feminina no WhatsApp" },
      {
        name: "description",
        content:
          "Landing page premium de moda feminina com atendimento personalizado via WhatsApp, peças selecionadas e experiência de boutique.",
      },
      { property: "og:title", content: "Encanto Feminino | Boutique Feminina no WhatsApp" },
      {
        property: "og:description",
        content:
          "Peças femininas selecionadas, atendimento humano e compra prática pelo WhatsApp em uma experiência de boutique premium.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: "Encanto Feminino | Boutique Feminina no WhatsApp" },
      {
        name: "twitter:description",
        content:
          "Moda feminina com curadoria delicada, atendimento próximo e conversão focada no WhatsApp.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "icon", href: brand.logo },
    ],
  }),
  component: Index,
});

function WhatsAppButton({
  className,
  children,
  variant = "default",
  product,
}: {
  product?: Product;
  className?: string;
  children: ReactNode;
  variant?: "default" | "outline" | "hero" | "soft";
}) {
  return (
    <Button asChild className={className} size="lg" variant={variant}>
      <a href={product ? whatsappUrl(product) : WHATSAPP_URL} target="_blank" rel="noreferrer">
        <MessageCircle />
        {children}
      </a>
    </Button>
  );
}

function Index() {
  const catalog = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    enabled: Boolean(supabase),
    refetchInterval: 30000,
  });
  const products = (
    supabase ? (catalog.isError ? [] : (catalog.data ?? [])) : initialProducts
  ).filter((product) => product.visible);
  return (
    <main className="bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <img
              src={brand.logo}
              alt="Logo Encanto Feminino"
              width={56}
              height={56}
              className="size-12 shrink-0 object-contain sm:size-14"
            />
            <span className="flex min-w-0 flex-col">
              <span className="font-display text-xl leading-none text-foreground sm:text-2xl">
                Encanto Feminino
              </span>
              <span className="mt-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Boutique feminina
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#inicio" className="transition-colors hover:text-foreground">
              Início
            </a>
            <a href="#colecao" className="transition-colors hover:text-foreground">
              Coleção
            </a>
            <a href="#como-comprar" className="transition-colors hover:text-foreground">
              Como Comprar
            </a>
            <a href="#depoimentos" className="transition-colors hover:text-foreground">
              Depoimentos
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

          <WhatsAppButton className="hidden sm:inline-flex">WhatsApp</WhatsAppButton>
        </div>
      </header>

      <section id="inicio" className="hero-shell border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <span className="section-kicker">Moda feminina com atendimento próximo</span>
            <h1 className="mt-5 max-w-xl font-display text-5xl leading-[0.95] text-balance text-foreground sm:text-6xl lg:text-7xl">
              Elegância feminina pensada para encantar em cada detalhe.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Uma boutique premium com curadoria delicada, peças selecionadas e atendimento humano
              pelo WhatsApp para ajudar você a escolher com segurança, conforto e exclusividade.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <a href="#colecao">
                  Ver coleção
                  <ArrowRight />
                </a>
              </Button>
              <WhatsAppButton variant="outline">Pedir pelo WhatsApp</WhatsAppButton>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="trust-chip">
                    <Icon />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="hero-visual">
              <img
                src={heroImage}
                alt="Camisola de renda da Encanto Feminino"
                width={1536}
                height={1920}
                className="h-full w-full object-cover"
              />
              <div className="hero-note hero-note-top">
                <Sparkles />
                <span>Curadoria premium</span>
              </div>
              <div className="hero-note hero-note-bottom">
                <MessageCircle />
                <span>Compra guiada no WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="space-y-6">
            <span className="section-kicker">Sobre a marca</span>
            <h2 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Delicadeza, exclusividade e um atendimento que valoriza você.
            </h2>
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              Inspirada pela estética suave do universo feminino e pela proximidade do atendimento
              artesanal, a Encanto Feminino seleciona peças com olhar cuidadoso para conforto,
              beleza e autoestima.
            </p>
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              Aqui, a compra não é fria nem automática: cada conversa ajuda a encontrar tamanhos,
              estilos e combinações que façam sentido para cada cliente.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <h3 className="mt-5 text-xl font-medium text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="colecao" className="section-shell section-collection">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="section-kicker">Coleção em destaque</span>
              <h2 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
                Uma vitrine elegante para escolher com calma e pedir com atendimento real.
              </h2>
            </div>
            <WhatsAppButton variant="soft">Solicitar atendimento</WhatsAppButton>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {Object.entries(categories)
              .filter(([key]) => key !== "todos")
              .map(([, label]) => label)
              .map((tag) => (
                <span key={tag} className="category-pill">
                  {tag}
                </span>
              ))}
          </div>

          {supabase && catalog.isPending && (
            <p role="status" className="mt-8">
              Carregando coleção…
            </p>
          )}
          {supabase && catalog.isError && (
            <div role="alert" className="mt-8">
              <p>Não foi possível consultar a disponibilidade agora.</p>
              <Button className="mt-3" onClick={() => catalog.refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}
          {!products.length && (!supabase || (!catalog.isPending && !catalog.isError)) && (
            <p className="mt-8">Nossa coleção está sendo atualizada. Fale conosco pelo WhatsApp.</p>
          )}
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.name} className="product-card">
                <div className="product-image-wrap">
                  <img
                    src={product.image}
                    alt={product.name}
                    width={1200}
                    height={1504}
                    loading="lazy"
                    className="product-image"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-accent-foreground/70">
                    {categories[product.category]}
                  </p>
                  <h3 className="mt-3 font-display text-3xl leading-none text-foreground">
                    {product.name}
                  </h3>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="text-xl font-medium text-foreground">
                      {formatPrice(product.price)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      {availabilityLabels[product.availability]}
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                  {product.availability === "indisponivel" ? (
                    <Button className="mt-6 w-full" size="lg" disabled>
                      Indisponível no momento
                    </Button>
                  ) : (
                    <WhatsAppButton product={product} className="mt-6 w-full" variant="outline">
                      Solicitar no WhatsApp
                    </WhatsAppButton>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-comprar" className="section-shell">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-kicker section-kicker-center">Como funciona</span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Da escolha ao pedido, tudo flui de forma simples, próxima e especial.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="step-card">
                <span className="step-number">0{index + 1}</span>
                <h3 className="mt-4 text-lg font-medium text-foreground">{step}</h3>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <WhatsAppButton>Falar com a boutique</WhatsAppButton>
          </div>
        </div>
      </section>

      <section id="depoimentos" className="section-shell section-testimonials">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-kicker section-kicker-center">
              Depoimentos · exemplos do modelo
            </span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Experiências que reforçam confiança antes mesmo da compra.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="testimonial-card">
                <div className="flex items-center gap-4">
                  <img
                    src={item.photo}
                    alt={item.name}
                    width={1200}
                    height={1504}
                    loading="lazy"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-base font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.item}</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">“{item.text}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section-shell">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-kicker section-kicker-center">Perguntas frequentes</span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Tudo o que a cliente precisa saber antes de chamar no WhatsApp.
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details key={item.question} className="faq-item group">
                <summary className="faq-summary">
                  <span>{item.question}</span>
                  <ChevronRight className="size-5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="faq-answer">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell pt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="cta-panel">
            <div className="max-w-2xl">
              <span className="section-kicker">Atendimento direto</span>
              <h2 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
                Descubra a peça ideal com um atendimento feminino, próximo e exclusivo.
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
                Chame agora no WhatsApp para consultar tamanhos, disponibilidade, combinações e
                formas de finalizar seu pedido com leveza e segurança.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <WhatsAppButton className="min-w-56">Falar no WhatsApp</WhatsAppButton>
              <Button asChild variant="ghost" size="lg">
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                  <Instagram />
                  Ver Instagram
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-secondary/35">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="font-display text-3xl text-foreground">Encanto Feminino</p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              Boutique feminina com seleção cuidadosa, estética delicada e atendimento pensado para
              converter com proximidade.
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Navegação</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-foreground">
              <a href="#colecao">Coleção</a>
              <a href="#como-comprar">Como comprar</a>
              <a href="#depoimentos">Depoimentos</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Contato</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-foreground">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                WhatsApp: (11) 99999-9999
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                Instagram: @_encantofeminino_01
              </a>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" /> Atendimento online e sob consulta
              </span>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="floating-whatsapp"
      >
        <MessageCircle className="size-6" />
      </a>
    </main>
  );
}
