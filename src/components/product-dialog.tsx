import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageCircle,
  Share2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductPhoto } from "@/components/product-photo";
import {
  availabilityLabels,
  categories,
  formatPrice,
  whatsappUrl,
  type Product,
} from "@/data/catalog";
import { productAvailability, productLink, productPhotos } from "@/lib/product-options";

export function ProductDialog({
  product,
  onClose,
  returnFocus,
}: {
  product: Product;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [notice, setNotice] = useState("");
  const [manualLink, setManualLink] = useState("");
  const photos = productPhotos(product);
  const selectedPhoto = Math.min(photoIndex, Math.max(photos.length - 1, 0));
  const variants = product.variants ?? [];
  const variant = variants.find((v) => v.id === variantId);
  const availability = variant?.availability ?? productAvailability(product);
  const needsSelection = variants.length > 0 && !variant;
  const canOrder = !needsSelection && availability !== "indisponivel";

  async function share(copyOnly = false) {
    const url = productLink(window.location.origin, product.id);
    setNotice("");
    setManualLink("");
    try {
      if (!copyOnly && navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Veja ${product.name} na Encanto Feminino`,
          url,
        });
        return;
      }
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setNotice("Link copiado. Cole no WhatsApp, Instagram ou onde preferir.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setManualLink(url);
      setNotice("Selecione e copie o link abaixo.");
    }
  }

  function changePhoto(index: number) {
    setPhotoIndex((index + photos.length) % photos.length);
    setZoom(false);
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="product-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
      >
        <div className="product-dialog-heading">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {categories[product.category]}
          </p>
          <DialogTitle className="mt-2 font-display text-3xl font-medium sm:text-4xl">
            {product.name}
          </DialogTitle>
          <DialogDescription className="mt-2">
            Veja os detalhes e consulte as opções para seu pedido.
          </DialogDescription>
        </div>
        <div className="product-dialog-grid">
          <div>
            <div
              className={`product-gallery-photo ${zoom ? "is-zoomed" : ""}`}
              tabIndex={zoom ? 0 : undefined}
              aria-label={zoom ? "Foto ampliada; role para explorar" : undefined}
            >
              <ProductPhoto
                src={photos[selectedPhoto]}
                alt={`${product.name} — foto ${selectedPhoto + 1}`}
                eager
                sizes="(max-width: 767px) 90vw, 650px"
              />
            </div>
            <div className="gallery-controls">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(!zoom)}
                aria-label={zoom ? "Reduzir foto" : "Ampliar foto"}
                aria-pressed={zoom}
              >
                {zoom ? <ZoomOut /> : <ZoomIn />}
              </Button>
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changePhoto(selectedPhoto - 1)}
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft />
                  </Button>
                  <span aria-live="polite" className="text-sm">
                    {selectedPhoto + 1} / {photos.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changePhoto(selectedPhoto + 1)}
                    aria-label="Próxima foto"
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="gallery-thumbnails" role="group" aria-label="Fotos do produto">
                {photos.map((photo, index) => (
                  <button
                    key={photo}
                    type="button"
                    aria-label={`Ver foto ${index + 1}`}
                    aria-pressed={index === selectedPhoto}
                    onClick={() => changePhoto(index)}
                  >
                    <ProductPhoto src={photo} alt="" sizes="72px" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="product-dialog-information">
            <p className="text-2xl font-semibold">
              {formatPrice(product.price)}{" "}
              <span className="text-sm font-normal text-muted-foreground">/ {product.unit}</span>
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{product.description}</p>
            {variants.length > 0 ? (
              <label className="variant-choice">
                Escolha o tamanho e a cor
                <select value={variant?.id ?? ""} onChange={(e) => setVariantId(e.target.value)}>
                  <option value="">Selecione uma opção</option>
                  {variants.map((option) => (
                    <option key={option.id} value={option.id}>
                      {[option.size, option.color].filter(Boolean).join(" · ")} —{" "}
                      {availabilityLabels[option.availability]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="mt-5 space-y-3 text-sm">
                {product.sizes.length > 0 && (
                  <p>
                    <strong>Tamanhos:</strong> {product.sizes.join(" · ")}
                  </p>
                )}
                {product.colors.length > 0 && (
                  <p>
                    <strong>{product.category === "sabonete" ? "Opções:" : "Cores:"}</strong>{" "}
                    {product.colors.join(" · ")}
                  </p>
                )}
              </div>
            )}
            <p role="status" className={`product-stock stock-${availability}`}>
              {needsSelection
                ? "Selecione uma opção para consultar a disponibilidade"
                : availabilityLabels[availability]}
            </p>
            {availability === "encomenda" && !needsSelection && (
              <p className="mb-4 text-sm leading-6 text-muted-foreground">
                {product.lead_time
                  ? `Prazo: ${product.lead_time}`
                  : "O prazo da encomenda é combinado pelo WhatsApp."}
              </p>
            )}
            <p className="mb-5 text-xs leading-6 text-muted-foreground">
              Confirme as opções, o valor e a entrega antes de finalizar seu pedido.
            </p>
            {canOrder ? (
              <Button asChild size="lg" className="w-full">
                <a href={whatsappUrl(product, variant)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  {availability === "encomenda" ? "Consultar encomenda" : "Pedir no WhatsApp"}
                </a>
              </Button>
            ) : (
              <Button disabled size="lg" className="w-full">
                {needsSelection ? "Escolha uma opção acima" : "Indisponível no momento"}
              </Button>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => share()}>
                <Share2 aria-hidden="true" />
                Compartilhar
              </Button>
              <Button variant="ghost" onClick={() => share(true)}>
                <Copy aria-hidden="true" />
                Copiar link
              </Button>
            </div>
            {notice && (
              <p role="status" className="mt-3 text-sm leading-6">
                {notice}
              </p>
            )}
            {manualLink && (
              <label className="variant-choice">
                Link do produto
                <input readOnly value={manualLink} onFocus={(e) => e.currentTarget.select()} />
              </label>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
