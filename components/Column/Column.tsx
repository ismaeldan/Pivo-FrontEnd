import TaskCard from '../TaskCard/TaskCard';
import styles from './Column.module.css';

// Por enquanto, o título será fixo, mas logo vamos receber por "props"
export default function Column() {
  return (
    <div className={styles.column}>
      <h2 className={styles.columnTitle}>A Fazer</h2>
      <div className={styles.tasksContainer}>
        {/* Renderiza alguns cartões estáticos para teste */}
        <TaskCard />
        <TaskCard />
        <TaskCard />
      </div>
    </div>
  );
}