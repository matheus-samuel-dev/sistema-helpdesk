import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import PageHeader from '../components/PageHeader';
import type { Category, Priority, User } from '../types';
import { CATEGORY_OPTIONS, priorityOptionsForRole } from '../utils/helpdesk';

const schema = z.object({
  title: z.string().min(3, 'Mínimo de 3 caracteres.').max(160),
  description: z.string().min(10, 'Descreva o problema com mais detalhes.').max(5000),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE', 'CRITICA']),
  category: z.enum([
    'HARDWARE',
    'SOFTWARE',
    'REDE',
    'IMPRESSORA',
    'ACESSO',
    'BANCO_DE_DADOS',
    'INFRAESTRUTURA',
    'OUTROS',
  ]),
  clientId: z.number().optional(),
});

type Form = z.infer<typeof schema>;

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<User[]>([]);
  const [error, setError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIA',
      category: 'OUTROS',
    },
  });

  const priorityOptions = priorityOptionsForRole(user?.role);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api
        .get('/users', { params: { role: 'CLIENTE', active: true, size: 100 } })
        .then((response) => setClients(response.data.content))
        .catch((err) => setError(errorMessage(err)));
    }
  }, [user]);

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      <PageHeader title="Novo chamado" breadcrumb="Atendimento / Novo chamado" />

      <Card>
        <CardContent sx={{ p: { xs: 2.2, sm: 4 } }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit(async (values) => {
              try {
                setError('');
                const { data } = await api.post('/tickets', values);
                navigate(`/tickets/${data.id}`);
              } catch (err) {
                setError(errorMessage(err));
              }
            })}
          >
            <Stack spacing={3}>
              <Box>
                <Typography fontWeight={700} fontSize={13} mb={0.8}>
                  Título *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Ex.: Usuário sem acesso ao e-mail corporativo"
                  {...register('title')}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              </Box>

              <Box>
                <Typography fontWeight={700} fontSize={13} mb={0.8}>
                  Descrição *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={7}
                  placeholder="Descreva o problema, o impacto e qualquer detalhe que ajude o suporte a agir com rapidez."
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel>Prioridade</InputLabel>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Prioridade">
                        {priorityOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{errors.priority?.message}</FormHelperText>
                </FormControl>

                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Categoria</InputLabel>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Categoria">
                        {CATEGORY_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{errors.category?.message}</FormHelperText>
                </FormControl>
              </Stack>

              {user?.role === 'ADMIN' && (
                <FormControl fullWidth>
                  <InputLabel>Solicitante</InputLabel>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        value={field.value ?? ''}
                        label="Solicitante"
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      >
                        <MenuItem value="" disabled>
                          Selecione o solicitante
                        </MenuItem>
                        {clients.map((client) => (
                          <MenuItem key={client.id} value={client.id}>
                            {client.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
                <Button color="inherit" onClick={() => navigate('/tickets')}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando chamado...' : 'Criar chamado'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
