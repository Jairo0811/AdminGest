import { MouseEvent, ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose(): void;
  /** Optional description announced together with the title. */
  description?: string;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Accessible modal dialog (WAI-ARIA dialog pattern):
 * - moves focus inside on open (first form control, otherwise the dialog itself);
 * - keeps Tab / Shift+Tab inside the dialog;
 * - closes with Escape or a click that starts and ends on the backdrop (dragging a text
 *   selection out of the dialog does not close it);
 * - returns focus to the element that opened it and locks the page scroll meanwhile.
 */
export function Modal({ title, children, onClose, description }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    const initial =
      focusables().find((element) => !element.classList.contains('modal-close')) ?? dialog;
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = focusables();
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const onBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  };
  const onBackdropMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (pressStartedOnBackdrop.current && event.target === event.currentTarget) onClose();
    pressStartedOnBackdrop.current = false;
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onBackdropMouseDown}
      onMouseUp={onBackdropMouseUp}
      role="presentation"
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button aria-label="Cerrar" className="icon-button modal-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={19} />
          </button>
        </header>
        {description && (
          <p className="modal-description" id={descriptionId}>
            {description}
          </p>
        )}
        {children}
      </section>
    </div>
  );
}
