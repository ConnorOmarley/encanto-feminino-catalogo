import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { VariantEditor } from "@/components/variant-editor";
import { productAvailability, productPhotos, validateVariants } from "@/lib/product-options";
import { Button } from "@/components/ui/button";
import {
  availabilityLabels,
  brand,
  categories,
  formatPrice,
  type BrandSettings,
  type Product,
} from "@/data/catalog";
import {
  fetchBrandSettings,
  fetchProducts,
  saveBrandSettings,
  saveProduct,
  supabase,
  uploadPhoto,
} from "@/lib/catalog-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel | Encanto Feminino" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

type Draft = Omit<Product, "id"> & { id?: number };
const emptyDraft: Draft = {
  name: "",
  category: "lingerie",
  description: "",
  price: 0,
  unit: "peça",
  image: "",
  sizes: [],
  colors: [],
  availability: "encomenda",
  visible: true,
  images: [],
  variants: [],
  lead_time: "",
};

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(Boolean(supabase));
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [brandDraft, setBrandDraft] = useState<BrandSettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [sizeText, setSizeText] = useState("");
  const [colorText, setColorText] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setSession(data.session);
      setChecking(false);
      if (sessionError) setError("Sua sessão expirou. Entre novamente.");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setAllowed(false);
    setItems([]);
    setLoaded(false);
    setDraft(null);
    if (!userId || !supabase) return;
    const client = supabase;
    async function load() {
      const { data, error: accessError } = await client
        .from("catalog_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      if (accessError || !data) {
        setError("Este acesso ainda não está autorizado a administrar a loja.");
        return;
      }
      setAllowed(true);
      try {
        const rows = await fetchProducts();
        if (active) {
          setItems(rows);
          setLoaded(true);
        }
      } catch {
        if (active)
          setError(
            "Não foi possível carregar os produtos. Recarregue a página para tentar novamente.",
          );
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [userId]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) setError("Não foi possível entrar. Confira seu e-mail e sua senha.");
      else setPassword("");
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function edit(product: Draft) {
    setDraft({
      ...product,
      images: product.images ?? [],
      variants: product.variants ?? [],
      lead_time: product.lead_time ?? "",
    });
    setSizeText(product.sizes.join(", "));
    setColorText(product.colors.join(", "));
    setPhoto(null);
    setGalleryFiles([]);
    setError("");
    setNotice("");
  }

  async function editBrand() {
    setError("");
    setNotice("");
    const settings = await fetchBrandSettings().catch(() => ({}));
    setBrandDraft({ ...brand, ...settings });
    setLogoFile(null);
  }

  function closeBrand() {
    setBrandDraft(null);
    setLogoFile(null);
    setError("");
  }

  async function saveBrand(event: FormEvent) {
    event.preventDefault();
    if (!brandDraft) return;
    setBrandBusy(true);
    setError("");
    setNotice("");
    try {
      if (!brandDraft.name.trim() || brandDraft.name.trim().length > 60)
        throw new Error("Informe um nome para a marca (até 60 caracteres).");
      if (!/^\+?[0-9]{10,15}$/.test(brandDraft.whatsapp.trim()))
        throw new Error("O WhatsApp deve ter de 10 a 15 dígitos (ex.: 5511999999999).");
      const handle = brandDraft.instagram.replace(/^@/, "").trim();
      if (!/^[A-Za-z0-9._]{1,30}$/.test(handle))
        throw new Error("O Instagram deve ter até 30 letras, números, ponto ou underline.");
      let prepared = { ...brandDraft, instagram: handle };
      if (logoFile) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(logoFile.type) ||
          logoFile.size > 5 * 1024 * 1024
        )
          throw new Error("A logo deve ser JPG, PNG ou WebP de até 5 MB.");
        prepared = { ...prepared, logo: await uploadPhoto(logoFile) };
      } else if (!prepared.logo.trim()) {
        throw new Error("Escolha uma logo ou mantenha a atual.");
      }
      await saveBrandSettings(prepared);
      setBrandDraft(null);
      setLogoFile(null);
      setNotice("Ajustes da marca salvos. O site já reflete as novas informações.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar os ajustes.");
    } finally {
      setBrandBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!draft.name.trim() || !Number.isFinite(draft.price) || draft.price < 0)
        throw new Error("Informe um nome e um preço válido.");
      if (!draft.image && !photo) throw new Error("Adicione uma foto do produto.");
      validateVariants(draft.variants ?? []);
      if (productPhotos(draft).length + galleryFiles.length + (!draft.image && photo ? 1 : 0) > 8)
        throw new Error("Use até 8 fotos por produto.");
      for (const file of [photo, ...galleryFiles].filter((file): file is File => Boolean(file))) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024
        )
          throw new Error("Cada foto deve ser JPG, PNG ou WebP de até 5 MB.");
      }
      let preparedDraft = { ...draft, images: [...(draft.images ?? [])] };
      if (photo) {
        preparedDraft = { ...preparedDraft, image: await uploadPhoto(photo) };
        setDraft(preparedDraft);
        setPhoto(null);
      }
      for (let index = 0; index < galleryFiles.length; index++) {
        const url = await uploadPhoto(galleryFiles[index]);
        preparedDraft = { ...preparedDraft, images: [...preparedDraft.images, url] };
        setDraft(preparedDraft);
        setGalleryFiles(galleryFiles.slice(index + 1));
      }
      const saved = await saveProduct({
        ...preparedDraft,
        name: draft.name.trim(),
        sizes: sizeText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        colors: colorText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setItems((previous) =>
        [...previous.filter((p) => p.id !== saved.id), saved].sort((a, b) => a.id - b.id),
      );
      setDraft(null);
      setNotice("Produto salvo. A alteração já está disponível no catálogo online.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError("Não foi possível sair. Tente novamente.");
    else {
      setSession(null);
      setAllowed(false);
      setItems([]);
      setDraft(null);
      setNotice("");
    }
    setBusy(false);
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a href="/" className="font-display text-3xl">
          {brand.name}
        </a>
        <a href="/" className="underline">
          Ver catálogo
        </a>
      </header>
      <div className="admin-content">
        <h1 className="font-display text-4xl sm:text-5xl">Painel da loja</h1>
        <p className="mb-7 mt-3 text-muted-foreground">
          Cuide dos produtos, das fotos e da disponibilidade em um só lugar.
        </p>
        {!supabase ? (
          <section className="admin-box">
            <h2 className="font-display text-3xl">Falta conectar sua loja</h2>
            <p className="mt-4 leading-7">
              O painel está preparado, mas o acesso e o salvamento online ainda não foram ativados.
              Peça ao responsável pelo site para concluir a conexão e criar seu acesso.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              As alterações estarão disponíveis aqui após essa configuração.
            </p>
          </section>
        ) : checking ? (
          <p role="status">Verificando acesso…</p>
        ) : !session ? (
          <form onSubmit={login} className="admin-box admin-login">
            <h2 className="font-display text-3xl">Entre para gerenciar</h2>
            <label>
              E-mail
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="mr-auto break-all text-sm">{session.user.email}</span>
              <Button variant="outline" disabled={busy} onClick={logout}>
                Sair
              </Button>
              {allowed && loaded && !draft && !brandDraft && (
                <>
                  <Button onClick={() => edit(emptyDraft)}>Adicionar produto</Button>
                  <Button variant="outline" onClick={() => void editBrand()}>
                    Ajustes da marca
                  </Button>
                </>
              )}
            </div>
            {allowed && !loaded && !error && <p role="status">Carregando produtos…</p>}
            {allowed && draft && (
              <form className="admin-box admin-form" onSubmit={save}>
                <h2 className="font-display text-3xl">
                  {draft.id ? "Editar produto" : "Novo produto"}
                </h2>
                <fieldset disabled={busy}>
                  <label>
                    Nome
                    <input
                      required
                      maxLength={120}
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </label>
                  <div className="admin-form-row">
                    <label>
                      Categoria
                      <select
                        value={draft.category}
                        onChange={(e) =>
                          setDraft({ ...draft, category: e.target.value as Product["category"] })
                        }
                      >
                        {Object.entries(categories)
                          .filter(([key]) => key !== "todos")
                          .map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Disponibilidade
                      <select
                        disabled={Boolean(draft.variants?.length)}
                        value={productAvailability(draft)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            availability: e.target.value as Product["availability"],
                          })
                        }
                      >
                        {Object.entries(availabilityLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="admin-form-row">
                    <label>
                      Preço (R$)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={draft.price}
                        onChange={(e) => setDraft({ ...draft, price: e.target.valueAsNumber })}
                      />
                    </label>
                    <label>
                      Unidade
                      <input
                        required
                        placeholder="peça, conjunto, unidade"
                        value={draft.unit}
                        onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    Descrição
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </label>
                  <label>
                    Prazo para encomendas (opcional)
                    <input
                      maxLength={160}
                      placeholder="Informe somente o prazo confirmado pela loja"
                      value={draft.lead_time ?? ""}
                      onChange={(event) => setDraft({ ...draft, lead_time: event.target.value })}
                    />
                  </label>
                  <label>
                    Foto principal do produto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    />
                    <span className="text-xs font-normal text-muted-foreground">
                      JPG, PNG ou WebP, até 5 MB. A nova foto substitui a atual ao salvar.
                    </span>
                  </label>
                  <div className="admin-gallery">
                    {productPhotos(draft).map((image, index) => (
                      <div key={image}>
                        <img
                          src={image}
                          alt={`Foto ${index + 1} de ${draft.name}`}
                          loading="lazy"
                        />
                        <span className="text-xs">
                          {image === draft.image ? "Foto principal" : `Foto ${index + 1}`}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {image !== draft.image && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  image,
                                  images: productPhotos(draft).filter((url) => url !== image),
                                })
                              }
                            >
                              Usar como principal
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Remover foto ${index + 1}`}
                            onClick={() => {
                              const remaining = productPhotos(draft).filter((url) => url !== image);
                              setDraft({
                                ...draft,
                                image: remaining[0] ?? "",
                                images: remaining.slice(1),
                              });
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label>
                    Adicionar fotos à galeria
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => setGalleryFiles(Array.from(event.target.files ?? []))}
                    />
                    <span className="text-xs font-normal text-muted-foreground">
                      Até 8 fotos no total. As fotos novas serão adicionadas ao salvar.
                    </span>
                  </label>
                  {galleryFiles.length > 0 && (
                    <p className="text-sm" role="status">
                      {galleryFiles.length}{" "}
                      {galleryFiles.length === 1 ? "foto selecionada" : "fotos selecionadas"}:{" "}
                      {galleryFiles.map((file) => file.name).join(", ")}
                    </p>
                  )}
                  <VariantEditor
                    value={draft.variants ?? []}
                    onChange={(variants) => setDraft({ ...draft, variants })}
                  />
                  <p className="mt-6 text-sm text-muted-foreground">
                    {draft.variants?.length
                      ? "Tamanhos e cores serão preenchidos automaticamente a partir das variações."
                      : "Sem variações, as opções abaixo ficam disponíveis para consulta pelo WhatsApp."}
                  </p>
                  <div className="admin-form-row">
                    <label>
                      Tamanhos, separados por vírgula
                      <input
                        disabled={Boolean(draft.variants?.length)}
                        placeholder="P, M, G, GG"
                        value={sizeText}
                        onChange={(e) => setSizeText(e.target.value)}
                      />
                    </label>
                    <label>
                      Cores ou opções, separadas por vírgula
                      <input
                        disabled={Boolean(draft.variants?.length)}
                        placeholder="Rosa, Branco"
                        value={colorText}
                        onChange={(e) => setColorText(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={draft.visible}
                      onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
                    />
                    Mostrar no catálogo
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit">{busy ? "Salvando…" : "Salvar produto"}</Button>
                    <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                      Cancelar
                    </Button>
                  </div>
                </fieldset>
              </form>
            )}
            {allowed && brandDraft && (
              <form className="admin-box admin-form" onSubmit={saveBrand}>
                <h2 className="font-display text-3xl">Ajustes da marca</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Nome, logo e contatos exibidos em todo o site. Ao salvar, o catálogo público já
                  atualiza.
                </p>
                <fieldset disabled={brandBusy}>
                  <label>
                    Nome da marca
                    <input
                      required
                      maxLength={60}
                      value={brandDraft.name}
                      onChange={(e) => setBrandDraft({ ...brandDraft, name: e.target.value })}
                    />
                  </label>
                  <div className="admin-form-row">
                    <label>
                      WhatsApp (somente números)
                      <input
                        required
                        inputMode="numeric"
                        placeholder="5511999999999"
                        value={brandDraft.whatsapp}
                        onChange={(e) => setBrandDraft({ ...brandDraft, whatsapp: e.target.value })}
                      />
                      <span className="text-xs font-normal text-muted-foreground">
                        Código do país + DDD + número, sem espaços.
                      </span>
                    </label>
                    <label>
                      Instagram (sem @)
                      <input
                        required
                        maxLength={30}
                        placeholder="encantofeminino01"
                        value={brandDraft.instagram}
                        onChange={(e) =>
                          setBrandDraft({ ...brandDraft, instagram: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  {brandDraft.logo && (
                    <div className="admin-brand-logo">
                      <img src={brandDraft.logo} alt="Logo atual da marca" />
                      <p className="text-xs leading-5 text-muted-foreground">
                        Logo atual exibida no topo e no rodapé do site.
                      </p>
                    </div>
                  )}
                  <label>
                    Nova logo (opcional)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    />
                    <span className="text-xs font-normal text-muted-foreground">
                      JPG, PNG ou WebP quadrada, até 5 MB. Ao escolher, substitui a atual no salvar.
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit">{brandBusy ? "Salvando…" : "Salvar ajustes"}</Button>
                    <Button type="button" variant="outline" onClick={closeBrand}>
                      Cancelar
                    </Button>
                  </div>
                </fieldset>
              </form>
            )}
            {allowed && loaded && !draft && !brandDraft && (
              <div className="admin-list">
                {items.length === 0 ? (
                  <p>Seu catálogo está vazio. Adicione o primeiro produto.</p>
                ) : (
                  items.map((product) => (
                    <article key={product.id} className="admin-product">
                      <img src={product.image} alt="" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-2xl">{product.name}</h2>
                        <p className="mt-1 text-sm">
                          {formatPrice(product.price)} ·{" "}
                          {availabilityLabels[productAvailability(product)]}
                        </p>
                        {!product.visible && (
                          <p className="mt-1 text-sm text-muted-foreground">Oculto no catálogo</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => edit(product)}
                        aria-label={`Editar ${product.name}`}
                      >
                        Editar
                      </Button>
                    </article>
                  ))
                )}
              </div>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="admin-notice">
            {notice}
          </p>
        )}
      </div>
    </main>
  );
}
