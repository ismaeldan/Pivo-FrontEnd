import styles from './Login.module.css';

export default function LoginPage() {
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1>Pivô Board</h1>
        <p>Acesse sua conta</p>
        {/* Formulário de Login virá aqui */}
        <input type="text" placeholder="Email" className={styles.input} />
        <input type="password" placeholder="Senha" className={styles.input} />
        <button className={styles.button}>Entrar</button>
      </div>
    </div>
  );
}