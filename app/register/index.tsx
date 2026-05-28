import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username: string): string | undefined {
  if (username.length < 3) return 'Must be at least 3 characters.';
  if (username.length > 30) return 'Must be 30 characters or fewer.';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Only letters, numbers, and underscores.';
  return undefined;
}

function getPasswordStrength(password: string): {
  label: string;
  color: string;
  score: number;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: '#ef4444', score };
  if (score <= 2) return { label: 'Fair', color: '#f97316', score };
  if (score <= 3) return { label: 'Good', color: '#eab308', score };
  return { label: 'Strong', color: '#22c55e', score };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};

    const usernameErr = validateUsername(username.trim());
    if (!username.trim()) {
      errs.username = 'Username is required.';
    } else if (usernameErr) {
      errs.username = usernameErr;
    }

    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!validateEmail(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    return errs;
  }

  async function handleRegister() {
    setTouched({ username: true, email: true, password: true, confirmPassword: true });

    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { username: username.trim() },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration failed', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
      );
    }
  }

  const passwordStrength = password ? getPasswordStrength(password) : null;
  const confirmMismatch =
    touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join WorldKrafter today</Text>
        </View>

        <View style={styles.form}>
          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[
                styles.input,
                touched.username && errors.username ? styles.inputError : null,
              ]}
              placeholder="your_username"
              placeholderTextColor="#4a4a6a"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (touched.username) {
                  const errs = validate();
                  setErrors((prev) => ({ ...prev, username: errs.username }));
                }
              }}
              onBlur={() => {
                touch('username');
                const errs = validate();
                setErrors((prev) => ({ ...prev, username: errs.username }));
              }}
            />
            {touched.username && errors.username ? (
              <Text style={styles.errorText}>{errors.username}</Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                touched.email && errors.email ? styles.inputError : null,
              ]}
              placeholder="you@example.com"
              placeholderTextColor="#4a4a6a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (touched.email) {
                  const errs = validate();
                  setErrors((prev) => ({ ...prev, email: errs.email }));
                }
              }}
              onBlur={() => {
                touch('email');
                const errs = validate();
                setErrors((prev) => ({ ...prev, email: errs.email }));
              }}
            />
            {touched.email && errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                touched.password && errors.password ? styles.inputError : null,
              ]}
              placeholder="Min. 8 characters"
              placeholderTextColor="#4a4a6a"
              secureTextEntry
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (touched.password) {
                  const errs = validate();
                  setErrors((prev) => ({ ...prev, password: errs.password }));
                }
                if (touched.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      confirmPassword && v !== confirmPassword
                        ? 'Passwords do not match.'
                        : undefined,
                  }));
                }
              }}
              onBlur={() => {
                touch('password');
                const errs = validate();
                setErrors((prev) => ({ ...prev, password: errs.password }));
              }}
            />
            {password.length > 0 ? (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            passwordStrength && passwordStrength.score >= i
                              ? passwordStrength.color
                              : '#2d2d44',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength?.color }]}>
                  {passwordStrength?.label}
                </Text>
              </View>
            ) : null}
            {touched.password && errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                confirmMismatch || (touched.confirmPassword && errors.confirmPassword)
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor="#4a4a6a"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (touched.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      v && password !== v ? 'Passwords do not match.' : undefined,
                  }));
                }
              }}
              onBlur={() => {
                touch('confirmPassword');
                const errs = validate();
                setErrors((prev) => ({ ...prev, confirmPassword: errs.confirmPassword }));
              }}
            />
            {touched.confirmPassword && errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
            {touched.confirmPassword && !errors.confirmPassword && confirmPassword.length > 0 ? (
              <Text style={styles.successText}>✓ Passwords match</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/sign-in')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  header: {
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b8fa8',
  },
  form: {
    gap: 20,
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c0c4d8',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  successText: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 2,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#8b8fa8',
    fontSize: 14,
  },
  footerLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});
