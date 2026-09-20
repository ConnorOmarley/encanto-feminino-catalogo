import { Button } from "@/components/ui/button";
import { availabilityLabels } from "@/data/catalog";
import type { ProductVariant } from "@/lib/product-options";

export function VariantEditor({
  value,
  onChange,
}: {
  value: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}) {
  function update(id: string, patch: Partial<ProductVariant>) {
    onChange(value.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  return (
    <section className="variant-editor" aria-labelledby="variant-editor-title">
      <h3 id="variant-editor-title" className="font-display text-2xl">
        Disponibilidade por tamanho e cor
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Cadastre apenas as combinações que você oferece. Sem variações, vale a disponibilidade geral
        do produto. Ao cadastrar variações, a vitrine passa a usar os status abaixo.
      </p>
      {value.map((variant, index) => (
        <div className="variant-editor-row" key={variant.id}>
          <label>
            Tamanho {index + 1}
            <input
              maxLength={40}
              placeholder="M ou tamanho único"
              value={variant.size}
              onChange={(e) => update(variant.id, { size: e.target.value })}
            />
          </label>
          <label>
            Cor / opção {index + 1}
            <input
              maxLength={60}
              placeholder="Rosa, lavanda…"
              value={variant.color}
              onChange={(e) => update(variant.id, { color: e.target.value })}
            />
          </label>
          <label>
            Status {index + 1}
            <select
              value={variant.availability}
              onChange={(e) =>
                update(variant.id, {
                  availability: e.target.value as ProductVariant["availability"],
                })
              }
            >
              {Object.entries(availabilityLabels).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(value.filter((v) => v.id !== variant.id))}
            aria-label={`Remover variação ${index + 1}`}
          >
            Remover
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        disabled={value.length >= 100}
        onClick={() =>
          onChange([
            ...value,
            { id: crypto.randomUUID(), size: "", color: "", availability: "indisponivel" },
          ])
        }
      >
        Adicionar variação
      </Button>
      {value.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Novas variações começam indisponíveis. Ajuste o status antes de salvar. Se remover todas,
          confira a disponibilidade geral.
        </p>
      )}
    </section>
  );
}
