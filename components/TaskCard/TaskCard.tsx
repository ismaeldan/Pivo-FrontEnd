import styles from './TaskCard.module.css';

export default function TaskCard() {
  return (
    <div className={styles.taskCard}>
      <p>Esta é uma tarefa de exemplo</p>
    </div>
  );
}