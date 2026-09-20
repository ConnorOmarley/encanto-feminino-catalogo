import productData from "./products.json";
import { productMessage, type ProductVariant } from "../lib/product-options";

export const brand = {
  name: "Encanto Feminino",
  logo: "/catalog/logo.png",
  socialImage:
    "/catalog/logo.svg",
  whatsapp: "5511999999999",
  instagram: "encantofeminino.demo",
} as const;

export type BrandSettings = {
  name: string;
  whatsapp: string;
  instagram: string;
  logo: string;
};

export const categories = {
  todos: "Todos",
  pijama: "Pijamas",
  lingerie: "Lingeries",
  calcinha: "Calcinhas",
  sabonete: "Sabonetes",
} as const;

export const availabilityLabels = {
  disponivel: "Disponível",
  encomenda: "Sob encomenda",
  indisponivel: "Indisponível",
} as const;

export type Availability = keyof typeof availabilityLabels;
export type Category = keyof typeof categories;
export type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "todos">;
  price: number;
  unit: string;
  description: string;
  image: string;
  images?: string[];
  variants?: ProductVariant[];
  lead_time?: string;
  sizes: string[];
  colors: string[];
  availability: Availability;
  visible: boolean;
};

// Fail visibly during development/build if a catalog edit introduces an invalid status.
export const products: Product[] = productData.map((product) => {
  if (
    !Object.hasOwn(availabilityLabels, product.availability) ||
    !Object.hasOwn(categories, product.category) ||
    product.category === "todos"
  ) {
    throw new Error(`Categoria ou disponibilidade inválida: ${product.name}`);
  }
  return product as Product;
});

export function whatsappUrl(
  product?: Product,
  variant?: ProductVariant,
  whatsapp: string = brand.whatsapp,
) {
  const message = product
    ? productMessage(product, variant)
    : "Olá! Vim pelo site Encanto Feminino e gostaria de saber mais sobre os produtos.";
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}

export function instagramUrl(handle: string) {
  const clean = handle.replace(/^@/, "").trim();
  return clean ? `https://www.instagram.com/${clean}` : "";
}

export function formatWhatsapp(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length !== 13) return whatsapp;
  const ddd = digits.slice(2, 4);
  const number = digits.slice(4);
  const split = number.length === 9 ? `${number.slice(0, 5)}-${number.slice(5)}` : number;
  return `(${ddd}) ${split}`;
}

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
