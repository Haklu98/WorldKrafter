import { useState } from 'react';
import { api } from '../../lib/api';
import styles from './Onboarding.module.css';

type Props = {
  onComplete: () => void;
};

export default function OnboardingPage({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Choose a name to continue.'); return; }

    setLoading(true);
    await api.profile.create(name.trim());
    setLoading(false);
    onComplete();
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>W</span>
        </div>
        <h1 className={styles.title}>WorldKrafter</h1>
        <p className={styles.subtitle}>
          Build worlds. Weave timelines.<br />Keep every legend alive.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label} htmlFor="display-name">
            What should we call you?
          </label>
          <input
            id="display-name"
            className={styles.input}
            type="text"
            placeholder="Your name or alias"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            autoFocus
            maxLength={40}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Setting up…' : 'Enter WorldKrafter'}
          </button>
        </form>
      </div>
    </div>
  );
}
