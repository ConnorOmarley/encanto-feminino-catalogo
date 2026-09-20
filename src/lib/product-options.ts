import type { Availability, Product } from "../data/catalog";

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  availability: Availability;
};

export function productAvailability(
  product: Pick<Product, "availability" | "variants">,
): Availability {
  if (!product.variants?.length) return product.availability;
  if (product.variants.some((v) => v.availability === "disponivel")) return "disponivel";
  if (product.variants.some((v) => v.availability === "encomenda")) return "encomenda";
  return "indisponivel";
}

export function productPhotos(product: Pick<Product, "image" | "images">) {
  return [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))];
}

export function validateVariants(variants: ProductVariant[]) {
  const pairs = new Set<string>();
  const ids = new Set<string>();
  for (const variant of variants) {
    if (!variant.id || ids.has(variant.id))
      throw new Error("Cada variação precisa de uma identificação única.");
    ids.add(variant.id);
    if (!variant.size.trim() && !variant.color.trim())
      throw new Error("Informe o tamanho ou a cor de cada variação.");
    if (!["disponivel", "encomenda", "indisponivel"].includes(variant.availability))
      throw new Error("Disponibilidade inválida na variação.");
    const pair = JSON.stringify([
      variant.size.trim().toLocaleLowerCase("pt-BR"),
      variant.color.trim().toLocaleLowerCase("pt-BR"),
    ]);
    if (pairs.has(pair)) throw new Error("Há uma combinação de tamanho e cor repetida.");
    pairs.add(pair);
  }
}

export function productMessage(product: Product, variant?: ProductVariant) {
  const selection = variant
    ? [variant.size && `tamanho ${variant.size}`, variant.color && `cor/opção ${variant.color}`]
        .filter(Boolean)
        .join(", ")
    : "";
  const availability = variant?.availability ?? productAvailability(product);
  return `Olá! Vim pelo site Encanto Feminino e tenho interesse em ${product.name}${selection ? ` (${selection})` : ""}. Gostaria de confirmar ${availability === "encomenda" ? "o prazo da encomenda" : "a disponibilidade"}, as opções e o valor.`;
}

export function parseProductId(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  if (!/^\d+$/.test(String(value))) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function productLink(origin: string, id: number) {
  const url = new URL("/", origin);
  url.searchParams.set("produto", String(id));
  return url.toString();
}
