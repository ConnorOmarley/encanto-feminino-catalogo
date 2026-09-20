import { useRef, useState, type ReactNode } from "react";
import { ProductDialog } from "@/components/product-dialog";
import { ProductPhoto } from "@/components/product-photo";
import { parseProductId, productAvailability } from "@/lib/product-options";
import { useQuery } from "@tanstack/react-query";
import {
  brand,
  products as initialProducts,
  categories,
  availabilityLabels,
  formatPrice,
  whatsappUrl,
  type Product,
  type Category,
  type Availability,
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
  Menu,
  X,
  Search,
  ShieldCheck,
  Sparkles,
  ZoomIn,
} from "lucide-react";

const heroImage = "/catalog/product-2.webp";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vim pelo site e quero atendimento personalizado para escolher minhas peças.")}`;
const INSTAGRAM_URL = "https://instagram.com/encantofeminino.demo";

const trustItems = [
  { icon: HandHeart, label: "Curadoria cuidadosa" },
  { icon: HeartHandshake, label: "Atendimento humano" },
  { icon: PackageCheck, label: "Peças selecionadas" },
  { icon: Clock3, label: "Prazo combinado" },
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

// Testimonials remain hidden until the client supplies genuine reviews.

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
  validateSearch: (search: Record<string, unknown>): { produto?: number } => ({
    produto: parseProductId(search.produto),
  }),
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
  const { produto: selectedId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const lastTrigger = useRef<HTMLElement | null>(null);
  const openProduct = (id: number, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    void navigate({ search: { produto: id }, resetScroll: false });
  };
  const closeProduct = () => {
    void navigate({ search: {}, replace: true, resetScroll: false });
  };
  const restoreFocus = () => {
    const target = lastTrigger.current?.isConnected
      ? lastTrigger.current
      : document.getElementById("colecao");
    target?.focus({ preventScroll: true });
  };
  const [category, setCategory] = useState<Category>("todos");
  const [availability, setAvailability] = useState<Availability | "todos">("todos");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const clearFilters = () => {
    setCategory("todos");
    setAvailability("todos");
    setSearch("");
  };
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const catalog = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    enabled: Boolean(supabase),
    refetchInterval: 30000,
  });
  const products = (supabase ? (catalog.isError ? [] : (catalog.data ?? [])) : initialProducts)
    .filter((product) => product.visible)
    .map((product) => ({ ...product, availability: productAvailability(product) }));
  const selectedProduct = products.find((product) => product.id === selectedId);
  const filteredProducts = products.filter(
    (product) =>
      (category === "todos" || product.category === category) &&
      (availability === "todos" || product.availability === availability) &&
      normalize(product.name + " " + product.description).includes(normalize(search.trim())),
  );
  const catalogReady = !supabase || (!catalog.isPending && !catalog.isError);
  const hasFilters = category !== "todos" || availability !== "todos" || Boolean(search);
  return (
    <main className="bg-background text-foreground">
      {selectedProduct && (
        <ProductDialog
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={closeProduct}
          returnFocus={restoreFocus}
        />
      )}
      {selectedId && catalogReady && !selectedProduct && (
        <div className="missing-product" role="alert">
          <p>Este produto não está mais no catálogo.</p>
          <Button variant="outline" onClick={closeProduct}>
            Ver coleção completa
          </Button>
        </div>
      )}
      <a href="#colecao" className="skip-to-catalog">
        Pular para a coleção
      </a>
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

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex"
          >
            <a href="#inicio" className="transition-colors hover:text-foreground">
              Início
            </a>
            <a href="#colecao" className="transition-colors hover:text-foreground">
              Coleção
            </a>
            <a href="#como-comprar" className="transition-colors hover:text-foreground">
              Como Comprar
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

          <WhatsAppButton className="hidden sm:inline-flex">WhatsApp</WhatsAppButton>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border lg:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Navegação no celular"
            className="border-t border-border px-4 py-3 lg:hidden"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMenuOpen(false);
                document
                  .querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')
                  ?.focus();
              }
            }}
          >
            {[
              ["#inicio", "Início"],
              ["#colecao", "Coleção"],
              ["#como-comprar", "Como comprar"],
              ["#faq", "Dúvidas frequentes"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block rounded-lg px-3 py-3 text-sm hover:bg-secondary"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
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
              <ProductPhoto
                eager
                sizes="(max-width: 1023px) 100vw, 600px"
                src={heroImage}
                alt="Camisola de renda da Encanto Feminino"
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

      <section id="colecao" tabIndex={-1} className="section-shell section-collection">
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

          <div
            className="mt-8 flex flex-wrap gap-3"
            role="group"
            aria-label="Categorias da coleção"
          >
            {Object.entries(categories).map(([key, label]) => (
              <button
                type="button"
                key={key}
                className="category-pill collection-category"
                aria-pressed={category === key}
                aria-controls="collection-products"
                onClick={() => setCategory(key as Category)}
              >
                {label}
                <span className="category-count">
                  {key === "todos"
                    ? products.length
                    : products.filter((product) => product.category === key).length}
                </span>
              </button>
            ))}
          </div>
          <div className="collection-tools">
            <label className="collection-search">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Buscar na coleção</span>
              <input
                type="search"
                placeholder="Buscar uma peça ou sabonete"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="collection-availability">
              <span className="sr-only">Disponibilidade</span>
              <select
                value={availability}
                onChange={(event) => setAvailability(event.target.value as Availability | "todos")}
              >
                <option value="todos">Todas as disponibilidades</option>
                {Object.entries(availabilityLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {catalogReady && (
            <div className="mt-5 flex min-h-11 flex-wrap items-center justify-between gap-2">
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  className="min-h-11 px-2 text-sm text-primary underline underline-offset-4"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

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
          {catalogReady && products.length > 0 && filteredProducts.length === 0 && (
            <div className="collection-empty">
              <Search className="mx-auto mb-4 size-7" aria-hidden="true" />
              <h3 className="font-display text-3xl">Nenhum produto com essa combinação.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Experimente outra categoria ou limpe os filtros para ver a coleção completa.
              </p>
            </div>
          )}
          <div
            id="collection-products"
            className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            aria-busy={Boolean(supabase && catalog.isPending)}
          >
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card collection-card">
                <div className="product-image-wrap relative">
                  <span className={`stock-label stock-${product.availability}`}>
                    {availabilityLabels[product.availability]}
                  </span>
                  <button
                    type="button"
                    className="product-photo-button"
                    aria-label={`Ver fotos e opções de ${product.name}`}
                    onClick={(event) => openProduct(product.id, event.currentTarget)}
                  >
                    <ProductPhoto
                      src={product.image}
                      alt={product.name}
                      className="product-image collection-product-photo"
                    />
                    <span className="photo-zoom-hint">
                      <ZoomIn className="size-4" aria-hidden="true" />
                      Ver fotos
                    </span>
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-accent-foreground/70">
                    {categories[product.category]}
                  </p>
                  <h3 className="mt-3 font-display text-3xl leading-none text-foreground">
                    <button
                      className="text-left hover:text-primary"
                      onClick={(event) => openProduct(product.id, event.currentTarget)}
                    >
                      {product.name}
                    </button>
                  </h3>
                  <details className="product-details">
                    <summary>
                      Detalhes do produto
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {product.description}
                    </p>
                    {product.sizes.length > 0 && (
                      <p className="mt-3 text-sm">
                        <span className="font-medium">Tamanhos:</span> {product.sizes.join(" · ")}
                      </p>
                    )}
                    {product.colors.length > 0 && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium">
                          {product.category === "sabonete" ? "Opções:" : "Cores:"}
                        </span>{" "}
                        {product.colors.join(" · ")}
                      </p>
                    )}
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      Confirme as opções e o prazo pelo WhatsApp.
                    </p>
                  </details>
                  <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                    <p className="text-xl font-medium text-foreground">
                      {formatPrice(product.price)}
                    </p>
                    <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                  </div>
                  {product.availability === "indisponivel" ? (
                    <Button className="mt-6 w-full" size="lg" disabled>
                      Indisponível no momento
                    </Button>
                  ) : product.variants?.length ? (
                    <Button
                      className="mt-6 w-full"
                      variant="outline"
                      size="lg"
                      onClick={(event) => openProduct(product.id, event.currentTarget)}
                    >
                      Escolher tamanho e cor
                    </Button>
                  ) : (
                    <WhatsAppButton product={product} className="mt-6 w-full" variant="outline">
                      {product.availability === "encomenda"
                        ? "Consultar encomenda"
                        : "Pedir no WhatsApp"}
                    </WhatsAppButton>
                  )}
                  <button
                    className="mt-3 min-h-11 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
                    onClick={(event) => openProduct(product.id, event.currentTarget)}
                  >
                    Ver detalhes e compartilhar
                  </button>
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
