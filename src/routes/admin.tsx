import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { availabilityLabels, brand, categories, formatPrice, type Product } from "@/data/catalog";
import { fetchProducts, saveProduct, supabase, uploadPhoto } from "@/lib/catalog-api";

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
};

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(Boolean(supabase));
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sizeText, setSizeText] = useState("");
  const [colorText, setColorText] = useState("");
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
    setDraft({ ...product });
    setSizeText(product.sizes.join(", "));
    setColorText(product.colors.join(", "));
    setPhoto(null);
    setError("");
    setNotice("");
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
      const image = photo ? await uploadPhoto(photo) : draft.image;
      if (photo) {
        setDraft({ ...draft, image });
        setPhoto(null);
      }
      const saved = await saveProduct({
        ...draft,
        name: draft.name.trim(),
        image,
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
              {allowed && loaded && !draft && (
                <Button onClick={() => edit(emptyDraft)}>Adicionar produto</Button>
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
                        value={draft.availability}
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
                    Foto do produto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    />
                    <span className="text-xs font-normal text-muted-foreground">
                      JPG, PNG ou WebP, até 5 MB. A nova foto substitui a atual ao salvar.
                    </span>
                  </label>
                  {draft.image && (
                    <img
                      className="admin-photo-preview"
                      src={draft.image}
                      alt={`Foto atual: ${draft.name}`}
                    />
                  )}
                  <div className="admin-form-row">
                    <label>
                      Tamanhos, separados por vírgula
                      <input
                        placeholder="P, M, G, GG"
                        value={sizeText}
                        onChange={(e) => setSizeText(e.target.value)}
                      />
                    </label>
                    <label>
                      Cores ou opções, separadas por vírgula
                      <input
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
            {allowed && loaded && !draft && (
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
                          {formatPrice(product.price)} · {availabilityLabels[product.availability]}
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
