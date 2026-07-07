import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import HeadsetMic from '@mui/icons-material/HeadsetMic';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, errorMessage, loginErrorMessage, logTechnicalError } from '../api';
import { APP_NAME, APP_SHORT_DESCRIPTION } from '../config/app';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
  remember: z.boolean(),
});

type Form = z.infer<typeof schema>;

type ResetState = {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
  generatedToken?: string;
  expiresAt?: string;
  message?: string;
};

const initialReset: ResetState = {
  email: '',
  token: '',
  password: '',
  confirmPassword: '',
};

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetState, setResetState] = useState<ResetState>(initialReset);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'admin@helpdesk.com',
      password: 'Admin@123',
      remember: true,
    },
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const requestReset = async () => {
    try {
      setResetLoading(true);
      setResetError('');
      const { data } = await api.post('/auth/password-reset/request', { email: resetState.email });
      setResetState((current) => ({
        ...current,
        token: data.token ?? '',
        generatedToken: data.token,
        expiresAt: data.expiresAt,
        message: data.message,
      }));
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  const confirmReset = async () => {
    if (resetState.password.length < 8) {
      setResetError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (resetState.password !== resetState.confirmPassword) {
      setResetError('As senhas informadas não conferem.');
      return;
    }
    try {
      setResetLoading(true);
      setResetError('');
      const { data } = await api.post('/auth/password-reset/confirm', {
        token: resetState.token,
        password: resetState.password,
      });
      setResetState({ ...initialReset, message: data.message });
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(circle at 85% 10%, rgba(47,140,255,0.22), transparent 30%), linear-gradient(135deg, #081a31 0%, #0f2746 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 470,
          p: { xs: 3, sm: 5 },
          bgcolor: 'rgba(7, 22, 41, 0.78)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(14px)',
          animation: 'dashboardEnter .45s ease both',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.4, mb: 1.2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              bgcolor: '#1769d2',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 16px 26px rgba(23, 105, 210, 0.28)',
            }}
          >
            <HeadsetMic fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4">{APP_NAME}</Typography>
            <Typography color="#9fb0c5" fontSize={13}>
              Plataforma de atendimento e gestão de chamados
            </Typography>
          </Box>
        </Box>

        <Typography align="center" sx={{ color: '#c2cfdf', mb: 4 }}>
          Faça login para acompanhar chamados, produtividade da equipe e indicadores operacionais.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit(async (values) => {
            if (loginLoading) {
              return;
            }
            try {
              setLoginLoading(true);
              setError('');
              await login(values.email, values.password, values.remember);
              navigate('/dashboard');
            } catch (err) {
              logTechnicalError('Falha no login', err);
              setError(loginErrorMessage(err));
            } finally {
              setLoginLoading(false);
            }
          })}
        >
          <Typography fontSize={13} fontWeight={700} mb={0.7}>
            E-mail
          </Typography>
          <TextField
            fullWidth
            placeholder="seu@email.com"
            error={!!errors.email}
            helperText={errors.email?.message}
            autoComplete="email"
            {...register('email')}
            sx={{
              mb: 2.2,
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white' },
              '& .MuiFormHelperText-root': { color: '#f4b0b0' },
            }}
          />

          <Typography fontSize={13} fontWeight={700} mb={0.7}>
            Senha
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            error={!!errors.password}
            helperText={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((current) => !current)}
                    sx={{ color: '#9ab0ca' }}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.2,
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white' },
              '& .MuiFormHelperText-root': { color: '#f4b0b0' },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={watch('remember')} onChange={(event) => setValue('remember', event.target.checked)} sx={{ color: '#9ab0ca' }} />}
              label={<Typography color="#c2cfdf">Lembrar de mim</Typography>}
            />

            <Link component="button" type="button" underline="hover" color="#9dc6ff" onClick={() => setForgotPasswordOpen(true)}>
              Esqueci minha senha
            </Link>
          </Box>

          <Button fullWidth size="large" variant="contained" type="submit" disabled={isSubmitting || loginLoading}>
            {isSubmitting || loginLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                Entrando...
              </Box>
            ) : (
              'Entrar'
            )}
          </Button>
        </Box>

        <Typography align="center" color="#9fb0c5" fontSize={12} mt={3}>
          {APP_SHORT_DESCRIPTION}
        </Typography>
      </Paper>

      <Dialog
        open={forgotPasswordOpen}
        onClose={() => !resetLoading && setForgotPasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Recuperação de senha</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {resetError && <Alert severity="error">{resetError}</Alert>}
            {resetState.message && <Alert severity={resetState.generatedToken ? 'info' : 'success'}>{resetState.message}</Alert>}

            <TextField
              label="E-mail cadastrado"
              value={resetState.email}
              onChange={(event) => setResetState((current) => ({ ...current, email: event.target.value }))}
              autoComplete="email"
              fullWidth
            />
            <Button variant="outlined" onClick={requestReset} disabled={resetLoading || !resetState.email.trim()}>
              {resetLoading ? 'Gerando token...' : 'Gerar token de redefinição'}
            </Button>

            {resetState.generatedToken && (
              <Alert severity="info">
                Envio simulado para portfólio. Token: <strong>{resetState.generatedToken}</strong>
                {resetState.expiresAt ? ` · expira em ${new Date(resetState.expiresAt).toLocaleString('pt-BR')}` : ''}
              </Alert>
            )}

            <TextField
              label="Token"
              value={resetState.token}
              onChange={(event) => setResetState((current) => ({ ...current, token: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Nova senha"
              type="password"
              value={resetState.password}
              onChange={(event) => setResetState((current) => ({ ...current, password: event.target.value }))}
              autoComplete="new-password"
              fullWidth
            />
            <TextField
              label="Confirmar nova senha"
              type="password"
              value={resetState.confirmPassword}
              onChange={(event) => setResetState((current) => ({ ...current, confirmPassword: event.target.value }))}
              autoComplete="new-password"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setForgotPasswordOpen(false)} disabled={resetLoading}>
            Fechar
          </Button>
          <Button variant="contained" onClick={confirmReset} disabled={resetLoading || !resetState.token.trim()}>
            {resetLoading ? 'Redefinindo...' : 'Redefinir senha'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
