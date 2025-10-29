import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.logo}>Pivô</span>
      <nav>
        {/* Links de navegação e Perfil do Usuário virão aqui */}
      </nav>
      <span>Usuário</span>
    </header>
  );
}