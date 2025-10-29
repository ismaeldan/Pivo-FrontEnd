"use client";

import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // O conteúdo (nosso formulário) virá aqui
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  return (
    // O Fundo (Backdrop)
    <div className={styles.backdrop} onClick={onClose}>
      
      {/* O Conteúdo do Modal */}
      <div 
        className={styles.modalContent} 
        // Impede que o clique no modal feche-o
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho do Modal */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times; {/* Este é um 'X' */}
          </button>
        </div>

        {/* Corpo do Modal (onde o formulário entrará) */}
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}