import Column from '../Column/Column'; // <-- Importe o novo componente
import styles from './BoardArea.module.css';

export default function BoardArea() {
  return (
    <div className={styles.boardContainer}>
      <h1 className={styles.boardTitle}>Meu Board</h1>
      <div className={styles.columnsWrapper}>
        
        {/* Renderiza as colunas estáticas */}
        <Column />
        <Column />
        <Column />

      </div>
    </div>
  );
}