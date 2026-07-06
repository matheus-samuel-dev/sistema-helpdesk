import { Chip } from '@mui/material';
import type { Category, Priority, Role, SlaStatus, Status } from '../types';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  ROLE_LABELS,
  SLA_LABELS,
  STATUS_LABELS,
} from '../utils/helpdesk';

const statusStyles: Record<Status, { bg: string; color: string }> = {
  ABERTO: { bg: '#e9f2ff', color: '#1769d2' },
  EM_ANDAMENTO: { bg: '#fff4db', color: '#9a6500' },
  RESOLVIDO: { bg: '#e4f7eb', color: '#148448' },
  CANCELADO: { bg: '#fde9e9', color: '#c43838' },
};

const priorityStyles: Record<Priority, { bg: string; color: string }> = {
  BAIXA: { bg: '#e4f7eb', color: '#148448' },
  MEDIA: { bg: '#fff4db', color: '#9a6500' },
  ALTA: { bg: '#fff0e4', color: '#d14c17' },
  URGENTE: { bg: '#fde9e9', color: '#c43838' },
  CRITICA: { bg: '#2a1010', color: '#ffb4a8' },
};

const roleStyles: Record<Role, { bg: string; color: string }> = {
  ADMIN: { bg: '#e9f2ff', color: '#1769d2' },
  TECNICO: { bg: '#eefaf3', color: '#148448' },
  CLIENTE: { bg: '#f4f0ff', color: '#6555c4' },
};

const categoryStyles: Record<Category, { bg: string; color: string }> = {
  HARDWARE: { bg: '#eef6ff', color: '#1769d2' },
  SOFTWARE: { bg: '#f2f7ff', color: '#365ec7' },
  REDE: { bg: '#edf9ff', color: '#0c7da7' },
  IMPRESSORA: { bg: '#fef3e8', color: '#d67814' },
  ACESSO: { bg: '#f5efff', color: '#6b4ec9' },
  BANCO_DE_DADOS: { bg: '#effcf2', color: '#178a4a' },
  INFRAESTRUTURA: { bg: '#fff3f1', color: '#c04f3e' },
  OUTROS: { bg: '#eef1f5', color: '#5d687a' },
};

const slaStyles: Record<SlaStatus, { bg: string; color: string }> = {
  DENTRO_DO_PRAZO: { bg: '#e4f7eb', color: '#148448' },
  PROXIMO_DO_VENCIMENTO: { bg: '#fff4db', color: '#9a6500' },
  VENCIDO: { bg: '#fde9e9', color: '#c43838' },
};

function badge(label: string, bg: string, color: string) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 28,
        px: 0.5,
        fontSize: 12,
        bgcolor: bg,
        color,
        borderRadius: 999,
      }}
    />
  );
}

export const StatusBadge = ({ value }: { value: Status }) =>
  badge(STATUS_LABELS[value], statusStyles[value].bg, statusStyles[value].color);

export const PriorityBadge = ({ value }: { value: Priority }) =>
  badge(PRIORITY_LABELS[value], priorityStyles[value].bg, priorityStyles[value].color);

export const CategoryBadge = ({ value }: { value: Category }) =>
  badge(CATEGORY_LABELS[value], categoryStyles[value].bg, categoryStyles[value].color);

export const RoleBadge = ({ value }: { value: Role }) =>
  badge(ROLE_LABELS[value], roleStyles[value].bg, roleStyles[value].color);

export const SlaBadge = ({ value }: { value: SlaStatus }) =>
  badge(SLA_LABELS[value], slaStyles[value].bg, slaStyles[value].color);

export const AccessBadge = ({ active }: { active: boolean }) =>
  badge(active ? 'Ativo' : 'Bloqueado', active ? '#e4f7eb' : '#f1f3f7', active ? '#148448' : '#5d687a');
