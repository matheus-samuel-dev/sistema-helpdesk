import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import AttachFileOutlined from '@mui/icons-material/AttachFileOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import Send from '@mui/icons-material/Send';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import AppSnackbar, { initialFeedback, type FeedbackState } from '../components/AppSnackbar';
import { CategoryBadge, PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import TicketEditDialog from '../components/TicketEditDialog';
import TicketStatusDialog from '../components/TicketStatusDialog';
import type { Attachment, Comment, History, HistoryEventType, Role, Ticket, User } from '../types';
import {
  formatBytes,
  formatDateTime,
  formatMinutes,
  formatSignedMinutes,
  getAvailableStatusOptions,
  getInitials,
  historyLabel,
} from '../utils/helpdesk';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography fontSize={11} color="text.secondary" textTransform="uppercase" letterSpacing={0.6}>
        {label}
      </Typography>
      <Box mt={0.7}>{value}</Box>
    </Box>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [commentText, setCommentText] = useState('');
  const [internalComment, setInternalComment] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [ticketResponse, commentsResponse, historyResponse, attachmentsResponse] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
        api.get(`/tickets/${id}/history`),
        api.get(`/tickets/${id}/attachments`).catch(() => ({ data: [] })),
      ]);
      setTicket(ticketResponse.data);
      setComments(commentsResponse.data);
      setHistory(historyResponse.data);
      setAttachments(attachmentsResponse.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api
        .get('/users', { params: { role: 'TECNICO', active: true, size: 100 } })
        .then((response) => setAnalysts(response.data.content))
        .catch((err) => setError(errorMessage(err)));
    }
  }, [user]);

  const timelineMeta = useMemo<Record<HistoryEventType, { icon: ReactNode; color: string }>>(
    () => ({
      CRIACAO: { icon: <AssignmentTurnedInOutlined />, color: '#1769d2' },
      ATRIBUICAO_TECNICO: { icon: <PersonAddAlt1Outlined />, color: '#1769d2' },
      ALTERACAO_STATUS: { icon: <ScheduleOutlined />, color: '#f0a51c' },
      ALTERACAO_PRIORIDADE: { icon: <TuneOutlined />, color: '#d67814' },
      ALTERACAO_CATEGORIA: { icon: <TuneOutlined />, color: '#365ec7' },
      ATUALIZACAO_DADOS: { icon: <EditNoteOutlined />, color: '#365ec7' },
      COMENTARIO: { icon: <EditNoteOutlined />, color: '#1769d2' },
      COMENTARIO_REMOVIDO: { icon: <CancelOutlined />, color: '#d94b4b' },
      ANEXO: { icon: <AttachFileOutlined />, color: '#365ec7' },
      REABERTURA: { icon: <ScheduleOutlined />, color: '#1769d2' },
      RESOLUCAO: { icon: <CheckCircleOutline />, color: '#1b9850' },
      CANCELAMENTO: { icon: <CancelOutlined />, color: '#d94b4b' },
    }),
    []
  );

  if (!ticket) {
    return error ? <Alert severity="error">{error}</Alert> : <Loading label="Carregando chamado..." />;
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'TECNICO';
  const canUseInternalComments = user?.role === 'ADMIN' || user?.role === 'TECNICO';
  const availableStatusOptions = getAvailableStatusOptions(ticket, user?.role as Role | undefined);

  const submitComment = async () => {
    if (!commentText.trim()) {
      return;
    }
    try {
      setCommentLoading(true);
      const payload = { text: commentText, internal: canUseInternalComments && internalComment };
      if (editingComment) {
        await api.put(`/tickets/${id}/comments/${editingComment.id}`, payload);
      } else {
        await api.post(`/tickets/${id}/comments`, payload);
      }
      setCommentText('');
      setInternalComment(false);
      setEditingComment(null);
      await load();
      setFeedback({ open: true, severity: 'success', message: editingComment ? 'Comentário atualizado com sucesso.' : 'Comentário adicionado com sucesso.' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCommentLoading(false);
    }
  };

  const deleteComment = async (comment: Comment) => {
    try {
      await api.delete(`/tickets/${id}/comments/${comment.id}`);
      await load();
      setFeedback({ open: true, severity: 'success', message: 'Comentário removido com sucesso.' });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const uploadAttachment = async (file?: File) => {
    if (!file) {
      return;
    }
    try {
      const body = new FormData();
      body.append('file', file);
      await api.post(`/tickets/${id}/attachments`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
      setFeedback({ open: true, severity: 'success', message: 'Anexo enviado com sucesso.' });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await api.get(`/tickets/${id}/attachments/${attachment.id}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: attachment.contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <Button startIcon={<ArrowBack />} color="inherit" onClick={() => navigate('/tickets')} sx={{ mb: 2 }}>
        Voltar para chamados
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h5" mb={1}>
            {ticket.title}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <StatusBadge value={ticket.status} />
            <PriorityBadge value={ticket.priority} />
            <CategoryBadge value={ticket.category} />
            <SlaBadge value={ticket.slaStatus} />
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {canEdit && (
            <Button variant="outlined" onClick={() => setEditing(true)}>
              Editar chamado
            </Button>
          )}
          <Button variant="contained" onClick={() => setChangingStatus(true)} disabled={availableStatusOptions.length === 0}>
            {ticket.status === 'RESOLVIDO' ? 'Reabrir chamado' : 'Alterar status'}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography fontWeight={700} mb={1.2}>
                  Descrição
                </Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography fontWeight={700} mb={2.4}>
                  Informações do chamado
                </Typography>
                <Grid container spacing={2.2}>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="ID" value={<Typography fontWeight={700}>#{ticket.id}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Solicitante" value={<Typography fontWeight={700}>{ticket.client.name}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Responsável" value={<Typography fontWeight={700}>{ticket.technician?.name ?? 'Não atribuído'}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="SLA" value={<SlaBadge value={ticket.slaStatus} />} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Vencimento SLA" value={<Typography fontWeight={700}>{formatDateTime(ticket.slaDueAt)}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Tempo restante" value={<Typography fontWeight={700}>{formatSignedMinutes(ticket.slaMinutesRemaining)}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Tempo aberto" value={<Typography fontWeight={700}>{formatMinutes(ticket.openMinutes)}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Tempo de resolução" value={<Typography fontWeight={700}>{formatMinutes(ticket.resolutionMinutes)}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Criado em" value={<Typography fontWeight={700}>{formatDateTime(ticket.createdAt)}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Atualizado em" value={<Typography fontWeight={700}>{formatDateTime(ticket.updatedAt)}</Typography>} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <DetailField label="Resolvido em" value={<Typography fontWeight={700}>{formatDateTime(ticket.resolvedAt)}</Typography>} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography fontWeight={700} mb={2}>
                  Comentários
                </Typography>

                {comments.length === 0 ? (
                  <EmptyState compact title="Nenhum comentário ainda" description="Use comentários públicos e internos para registrar o andamento do atendimento." />
                ) : (
                  <Stack spacing={1.4}>
                    {comments.map((comment) => (
                      <Box key={comment.id} sx={{ display: 'flex', gap: 1.4, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.6)' }}>
                        <Avatar sx={{ bgcolor: '#dbe8f8', color: '#1769d2' }}>{getInitials(comment.author.name)}</Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography fontWeight={700}>{comment.author.name}</Typography>
                            <Typography color="text.secondary" fontSize={12}>{comment.author.role}</Typography>
                            {comment.internal && <Typography fontSize={11} fontWeight={800} sx={{ color: '#9a6500', bgcolor: '#fff4db', px: 1, py: 0.2, borderRadius: 999 }}>Interno</Typography>}
                            <Typography color="text.secondary" fontSize={12}>{formatDateTime(comment.createdAt)}</Typography>
                          </Stack>
                          <Typography mt={0.5} sx={{ whiteSpace: 'pre-wrap' }}>{comment.text}</Typography>
                        </Box>
                        {(comment.author.id === user?.id || user?.role === 'ADMIN') && (
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Editar comentário">
                              <IconButton size="small" onClick={() => { setEditingComment(comment); setCommentText(comment.text); setInternalComment(comment.internal); }}>
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir comentário">
                              <IconButton size="small" color="error" onClick={() => deleteComment(comment)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Adicione um comentário. Enter envia, Shift+Enter quebra linha."
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        submitComment();
                      }
                    }}
                    aria-label="Adicionar comentário"
                  />
                  <Button variant="contained" endIcon={<Send />} disabled={!commentText.trim() || commentLoading} onClick={submitComment}>
                    {commentLoading ? 'Enviando...' : editingComment ? 'Salvar' : 'Enviar'}
                  </Button>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} mt={1}>
                  {canUseInternalComments && (
                    <FormControlLabel
                      control={<Checkbox checked={internalComment} onChange={(event) => setInternalComment(event.target.checked)} />}
                      label="Comentário interno"
                    />
                  )}
                  {editingComment && (
                    <Button color="inherit" onClick={() => { setEditingComment(null); setCommentText(''); setInternalComment(false); }}>
                      Cancelar edição
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Box>
                    <Typography fontWeight={700}>Anexos</Typography>
                    <Typography color="text.secondary" fontSize={13}>
                      PDF, imagens, DOCX e XLSX com download protegido.
                    </Typography>
                  </Box>
                  <Button component="label" variant="outlined" startIcon={<AttachFileOutlined />}>
                    Enviar anexo
                    <input hidden type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx" onChange={(event) => uploadAttachment(event.target.files?.[0])} />
                  </Button>
                </Box>

                {attachments.length === 0 ? (
                  <EmptyState compact title="Nenhum anexo" description="Arquivos importantes para o atendimento aparecerão aqui." />
                ) : (
                  <Stack spacing={1.2}>
                    {attachments.map((attachment) => (
                      <Box key={attachment.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} noWrap>{attachment.name}</Typography>
                          <Typography color="text.secondary" fontSize={12}>
                            {attachment.contentType} · {formatBytes(attachment.sizeBytes)} · {formatDateTime(attachment.createdAt)}
                          </Typography>
                          <Typography color="text.secondary" fontSize={12}>Enviado por {attachment.author.name}</Typography>
                        </Box>
                        <Tooltip title="Baixar anexo">
                          <IconButton onClick={() => downloadAttachment(attachment)} aria-label={`Baixar anexo ${attachment.name}`}>
                            <DownloadOutlined />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography fontWeight={700} mb={2}>
                Timeline do chamado
              </Typography>

              {history.length === 0 ? (
                <EmptyState compact title="Sem histórico registrado" description="As principais alterações do chamado serão organizadas aqui em ordem cronológica." />
              ) : (
                <Stack spacing={0}>
                  {history.map((item, index) => {
                    const meta = timelineMeta[item.eventType];
                    return (
                      <Box key={item.id} sx={{ display: 'flex', gap: 1.4, minHeight: 102 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${meta.color}14`, color: meta.color, mt: 0.2 }}>
                            {meta.icon}
                          </Box>
                          {index < history.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: '#dde5ef', mt: 1 }} />}
                        </Box>
                        <Box sx={{ pb: 2 }}>
                          <Typography fontWeight={700}>{historyLabel(item.eventType)}</Typography>
                          <Typography color="text.secondary" fontSize={13} mt={0.3}>{item.description}</Typography>
                          <Typography color="text.secondary" fontSize={12} mt={0.8}>{formatDateTime(item.createdAt)} · por {item.actor.name}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TicketEditDialog
        open={editing}
        ticket={ticket}
        analysts={analysts}
        role={user?.role}
        onClose={() => setEditing(false)}
        onUpdated={async (message) => {
          await load();
          setFeedback({ open: true, severity: 'success', message });
        }}
      />

      <TicketStatusDialog
        open={changingStatus}
        ticket={ticket}
        role={user?.role}
        onClose={() => setChangingStatus(false)}
        onUpdated={async (message) => {
          await load();
          setFeedback({ open: true, severity: 'success', message });
        }}
      />

      <AppSnackbar feedback={feedback} onClose={() => setFeedback((current) => ({ ...current, open: false }))} />
    </>
  );
}
