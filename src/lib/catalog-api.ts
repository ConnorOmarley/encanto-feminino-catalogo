import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/data/catalog";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) throw new Error("O catálogo online ainda não foi conectado.");
  const { data, error } = await supabase.from("products").select("*").order("id");
  if (error) throw new Error("Não foi possível atualizar o catálogo. Tente novamente.");
  return data as Product[];
}

export async function saveProduct(product: Omit<Product, "id"> & { id?: number }) {
  if (!supabase) throw new Error("O catálogo online ainda não foi conectado.");
  const { data, error } = product.id
    ? await supabase.from("products").update(product).eq("id", product.id).select().single()
    : await supabase.from("products").insert(product).select().single();
  if (error || !data)
    throw new Error(
      "Não foi possível salvar. Verifique sua conexão e a permissão de administradora.",
    );
  return data as Product;
}

export async function uploadPhoto(file: File) {
  if (!supabase) throw new Error("O catálogo online ainda não foi conectado.");
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!extensions[file.type] || file.size > 5 * 1024 * 1024) {
    throw new Error("Escolha uma imagem JPG, PNG ou WebP de até 5 MB.");
  }
  const path = `${crypto.randomUUID()}.${extensions[file.type]}`;
  const { error } = await supabase.storage
    .from("product-photos")
    .upload(path, file, { contentType: file.type });
  if (error)
    throw new Error("Não foi possível enviar a foto. Verifique sua conexão e tente novamente.");
  return supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl;
}
