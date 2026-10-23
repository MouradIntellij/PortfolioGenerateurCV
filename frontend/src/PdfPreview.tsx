import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = workerUrl;
export default function PdfPreview({ url }: { url: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setError("");
    const host = container.current!;
    host.replaceChildren();
    const task = getDocument(url);
    void (async () => {
      try {
        const pdf = await task.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.setAttribute("role", "img");
          canvas.setAttribute(
            "aria-label",
            `CV, page ${i} sur ${pdf.numPages}. Utilisez le lien sous l’aperçu pour ouvrir le PDF textuel.`,
          );
          await page.render({
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise;
          if (!cancelled) host.append(canvas);
        }
      } catch {
        if (!cancelled)
          setError(
            "Aperçu indisponible. Ouvrez le PDF avec le lien ci-dessous ou téléchargez-le.",
          );
      }
    })();
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [url]);
  return (
    <>
      <div className="pdf-pages" ref={container} />
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </>
  );
}
