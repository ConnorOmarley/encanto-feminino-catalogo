import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/data/catalog";
import { productAvailability, productPhotos, validateVariants } from "@/lib/product-options";
import { preparePhoto } from "@/lib/prepare-photo";

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
  const variants = (product.variants ?? []).map((v) => ({
    ...v,
    size: v.size.trim(),
    color: v.color.trim(),
  }));
  validateVariants(variants);
  const photos = productPhotos(product);
  if (photos.length > 8) throw new Error("Use até 8 fotos por produto.");
  const payload = {
    ...product,
    variants,
    images: photos.filter((photo) => photo !== product.image),
    availability: productAvailability({ ...product, variants }),
  };
  if (variants.length) {
    payload.sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    payload.colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  }
  const { data, error } = product.id
    ? await supabase.from("products").update(payload).eq("id", product.id).select().single()
    : await supabase.from("products").insert(payload).select().single();
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
  let prepared = file;
  try {
    prepared = await preparePhoto(file);
  } catch {
    /* Original remains valid if browser conversion is unavailable. */
  }
  const path = `${crypto.randomUUID()}.${extensions[prepared.type]}`;
  const { error } = await supabase.storage
    .from("product-photos")
    .upload(path, prepared, { contentType: prepared.type });
  if (error)
    throw new Error("Não foi possível enviar a foto. Verifique sua conexão e tente novamente.");
  return supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl;
}
