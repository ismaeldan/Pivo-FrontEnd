import styles from './Login.module.css';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>

        <Image 
          src="Pivo-logo.svg"
          alt="Pivô Logo"
          width={200}
          height={150}
          className={styles.logo}
        />

        <h1>Pivô Board</h1>
        <p className={styles.p}>Acesse sua conta</p>
        {/* Formulário de Login virá aqui */}
        <input type="text" placeholder="Email" className={styles.input} />
        <input type="password" placeholder="Senha" className={styles.input} />
        <button className={styles.button}>Entrar</button>
      </div>
    </div>
  );
}