import styles from './PrivacyPage.module.css'

interface Props {
  onBack: () => void
}

export function PrivacyPage({ onBack }: Props) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Tornar al joc</button>
        <h1 className={styles.title}>Política de privacitat</h1>
      </header>

      <div className={styles.content}>
        <p className={styles.disclaimer}>
          Aquest text no substitueix assessorament legal professional.
          L'Escalada de Paraules és un projecte personal sense finalitat comercial.
        </p>

        <section className={styles.section}>
          <h2>Responsable del tractament</h2>
          <p>
            L'Escalada de Paraules és un projecte personal.
            Per a qualsevol qüestió sobre les teves dades, pots contactar a:{' '}
            <a href="mailto:611josegonzalez@gmail.com">611josegonzalez@gmail.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>Quines dades es recullen</h2>
          <h3>Sense compte d'usuari (mode actual)</h3>
          <ul>
            <li><strong>localStorage del navegador:</strong> resultats de les teves partides (puntuació, temps, data), preferència d'idioma i si has vist les instruccions. Aquestes dades queden al teu dispositiu i no s'envien a cap servidor.</li>
            <li><strong>Analytics anònims</strong> (si n'hi ha): si s'utilitza algun servei d'analítica, es registren dades agregades i anònimes com visites i idioma. No s'enregistra cap paraula que introdueixis.</li>
          </ul>
          <h3>Amb compte d'usuari (futur)</h3>
          <p>Si s'implementa el sistema de comptes:</p>
          <ul>
            <li>Correu electrònic (per identificació).</li>
            <li>Resultats de partides: puntuació, temps, data, idioma.</li>
            <li><strong>No</strong> es guarden les paraules que introdueixis (llevat que acceptis explícitament guardar el detall de respostes).</li>
            <li><strong>No</strong> es guarden: IP, user-agent, ni altres dades de dispositiu.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Per a quins fins</h2>
          <ul>
            <li>Guardar el teu progrés entre sessions (localStorage local).</li>
            <li>Mostrar-te les teves estadístiques de joc.</li>
            <li>En cas de compte: associar els teus resultats al teu perfil per accedir-hi des de qualsevol dispositiu.</li>
          </ul>
          <p>Base legal orientativa: consentiment de l'usuari i execució del servei sol·licitat.</p>
        </section>

        <section className={styles.section}>
          <h2>Quant temps es conserven</h2>
          <ul>
            <li><strong>localStorage:</strong> fins que l'esborres manualment des del joc o des del navegador.</li>
            <li><strong>Compte d'usuari (futur):</strong> fins que sol·licitis l'eliminació del compte.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Proveïdors tècnics</h2>
          <ul>
            <li><strong>Vercel:</strong> allotjament de l'aplicació. Pot registrar logs de servidor (IPs) com a part normal del servei. Consulta la <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">política de Vercel</a>.</li>
            <li><strong>Supabase (futur):</strong> base de dades i autenticació. Les dades s'emmagatzemen en servidors d'AWS (Europa). Consulta la <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">política de Supabase</a>.</li>
          </ul>
          <p>Si s'usen aquests proveïdors, es recomana formalitzar un DPA (Data Processing Agreement) amb cadascun.</p>
        </section>

        <section className={styles.section}>
          <h2>Els teus drets</h2>
          <p>D'acord amb el GDPR tens dret a:</p>
          <ul>
            <li><strong>Accés:</strong> saber quines dades tenim sobre tu.</li>
            <li><strong>Rectificació:</strong> corregir dades incorrectes.</li>
            <li><strong>Supressió:</strong> demanar l'eliminació de les teves dades.</li>
            <li><strong>Portabilitat:</strong> rebre les teves dades en format llegible.</li>
            <li><strong>Oposició:</strong> oposar-te a determinats tractaments.</li>
          </ul>
          <p>
            Per exercir qualsevol d'aquests drets, contacta a{' '}
            <a href="mailto:611josegonzalez@gmail.com">611josegonzalez@gmail.com</a>.
          </p>
          <p>
            Dades locals: pots esborrar-les directament des del teu navegador
            (Configuració → Privacitat → Dades del lloc → escalada-paraules).
          </p>
        </section>

        <section className={styles.section}>
          <h2>Cookies i emmagatzematge local</h2>
          <p>
            Aquesta aplicació utilitza <strong>localStorage</strong> (no cookies) per guardar
            l'estat de les partides i preferències. No s'utilitzen cookies de seguiment ni de publicitat.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Seguretat</h2>
          <ul>
            <li>Les contrasenyes (en cas de compte) es gestionen exclusivament via Supabase Auth i mai es guarden en text pla al nostre codi.</li>
            <li>No s'usa la clau <code>service_role</code> de Supabase al codi del client.</li>
            <li>Les connexions es fan sempre per HTTPS.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Modificacions d'aquesta política</h2>
          <p>
            Si es fan canvis significatius, s'informarà dins de l'aplicació.
            La data de l'última actualització apareix a continuació.
          </p>
          <p className={styles.updated}>Última actualització: juny 2026</p>
        </section>
      </div>
    </div>
  )
}
