import productData from "./products.json";
import { productMessage, type ProductVariant } from "../lib/product-options";

export const brand = {
  name: "Encanto Feminino",
  logo: "/catalog/logo.png",
  socialImage:
    "/catalog/logo.svg",
  whatsapp: "5511999999999",
  instagram: "https://www.instagram.com/encantofeminino.demo/",
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

export function whatsappUrl(product?: Product, variant?: ProductVariant) {
  const message = product
    ? productMessage(product, variant)
    : "Olá! Vim pelo site Encanto Feminino e gostaria de saber mais sobre os produtos.";
  return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
