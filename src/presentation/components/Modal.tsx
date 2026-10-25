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
  const backdropPressed = useRef(false);
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
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        backdropPressed.current =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
      }}
      onPointerCancel={() => {
        backdropPressed.current = false;
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (backdropPressed.current && outside) onClose?.();
        backdropPressed.current = false;
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </dialog>
  );
}
