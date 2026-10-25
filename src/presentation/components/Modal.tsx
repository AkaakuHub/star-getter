import { X } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';

export function Modal({
  title,
  onClose,
  children,
  className = '',
}: Readonly<{
  title: string;
  onClose?: () => void;
  children: ComponentChildren;
  className?: string;
}>) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [title]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        {onClose && (
          <button type="button" className="icon-button" aria-label="閉じる" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
