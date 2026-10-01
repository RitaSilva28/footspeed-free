import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ConeColor } from '../types';
import styles from './Settings.module.css';

interface ConeEditorProps {
  cone: ConeColor;
  number: number;
  onSave: (name: string, color: string) => void;
  onDismiss: () => void;
}

export default function ConeEditor({ cone, number, onSave, onDismiss }: ConeEditorProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(cone.name);
  const [hex, setHex] = useState(cone.color);
  const [error, setError] = useState('');
  const validHex = /^#[0-9a-f]{6}$/i.test(hex);

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const closeEditor = (event: Event) => {
      event.preventDefault();
      onDismiss();
    };
    window.addEventListener('footspeed:back', closeEditor);
    return () => window.removeEventListener('footspeed:back', closeEditor);
  }, [onDismiss]);

  return (
    <dialog ref={dialog} className={styles.editConeDialog} aria-labelledby="cone-editor-title"
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}>
      <form className={styles.editConeForm} onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim() || !validHex) {
          setError('Enter a name and a hex color such as #FF0000.');
          return;
        }
        onSave(name.trim(), hex);
      }}>
        <div className={styles.editHeading}>
          <h2 id="cone-editor-title">Edit cone {number}</h2>
          <button type="button" className={styles.editBtn} aria-label="Close color editor" onClick={onDismiss}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <label htmlFor="cone-name">Name</label>
        <input id="cone-name" className={styles.editConeInput} value={name} required
          aria-describedby="cone-name-help" onChange={event => setName(event.target.value)} />
        <p id="cone-name-help" className={styles.editHelp}>This name is announced during training.</p>
        <div className={styles.editColors}>
          <div>
            <label htmlFor="cone-picker">Color</label>
            <input id="cone-picker" type="color" className={styles.editConeColorPicker}
              value={validHex ? hex : cone.color} onChange={event => setHex(event.target.value)} />
          </div>
          <div className={styles.hexField}>
            <label htmlFor="cone-hex">Hex color</label>
            <input id="cone-hex" className={styles.editConeInput} value={hex} required
              pattern="#[0-9a-fA-F]{6}" title="Use # followed by six hexadecimal characters"
              spellCheck={false} autoCapitalize="off" onChange={event => setHex(event.target.value)} />
          </div>
        </div>
        {error && <p role="alert" className={styles.editHelp}>{error}</p>}
        <div className={styles.editActions}>
          <button type="button" className={styles.editConeCancelBtn} onClick={onDismiss}>Cancel</button>
          <button type="submit" className={styles.editConeSaveBtn}>Save color</button>
        </div>
      </form>
    </dialog>
  );
}
