import styles from './BoardArea.module.css';

// Isto cumpre o item "Criar layout principal estático (Header, Board)"
//
export default function BoardArea() {
  return (
    <div className={styles.boardContainer}>
      <h1 className={styles.boardTitle}>Meu Board</h1>
      <div className={styles.columnsWrapper}>
        {/* Aqui é onde os componentes Column.tsx 
            e TaskCard.tsx entrarão */}
        <p>(Em breve: Colunas e Tarefas)</p>
      </div>
    </div>
  );
}