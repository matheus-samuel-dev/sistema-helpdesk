import { describe, expect, it } from 'vitest';
import { getAvailableStatusOptions, priorityOptionsForRole } from './helpdesk';

describe('helpdesk rules', () => {
  it('shows critical priority only for admins', () => {
    expect(priorityOptionsForRole('ADMIN').map((option) => option.value)).toContain('CRITICA');
    expect(priorityOptionsForRole('TECNICO').map((option) => option.value)).not.toContain('CRITICA');
    expect(priorityOptionsForRole('CLIENTE').map((option) => option.value)).not.toContain('CRITICA');
  });

  it('keeps the professional ticket status flow', () => {
    expect(getAvailableStatusOptions({ status: 'ABERTO' }, 'ADMIN')).toEqual(['EM_ANDAMENTO', 'CANCELADO']);
    expect(getAvailableStatusOptions({ status: 'EM_ANDAMENTO' }, 'TECNICO')).toEqual(['RESOLVIDO', 'CANCELADO']);
    expect(getAvailableStatusOptions({ status: 'RESOLVIDO' }, 'ADMIN')).toEqual(['EM_ANDAMENTO']);
    expect(getAvailableStatusOptions({ status: 'CANCELADO' }, 'ADMIN')).toEqual([]);
    expect(getAvailableStatusOptions({ status: 'ABERTO' }, 'CLIENTE')).toEqual([]);
  });
});

