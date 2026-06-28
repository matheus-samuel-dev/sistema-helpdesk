import { useEffect, useRef, useState } from 'react';
import {
  Box,
  ClickAwayListener,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { SearchResponse, SearchResult } from '../types';
import EmptyState from './EmptyState';

const emptyResults: SearchResponse = {
  tickets: [],
  users: [],
  categories: [],
  comments: [],
};

const groups: Array<{ key: keyof SearchResponse; label: string }> = [
  { key: 'tickets', label: 'Chamados' },
  { key: 'users', label: 'Usuários' },
  { key: 'categories', label: 'Categorias' },
  { key: 'comments', label: 'Comentários' },
];

export default function GlobalSearch() {
  const navigate = useNavigate();
  const requestId = useRef(0);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>(emptyResults);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults(emptyResults);
      setLoading(false);
      return;
    }

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    const timeout = window.setTimeout(() => {
      api
        .get('/search', { params: { q: normalized } })
        .then((response) => {
          if (requestId.current === currentRequest) {
            setResults(response.data);
          }
        })
        .finally(() => {
          if (requestId.current === currentRequest) {
            setLoading(false);
          }
        });
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const total = groups.reduce((sum, group) => sum + results[group.key].length, 0);

  const openResult = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.targetUrl);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: { xs: '100%', md: 420 }, maxWidth: '100%' }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder="Pesquisar chamados, usuários, categorias e comentários"
          aria-label="Pesquisa global"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
        />

        {open && query.trim().length >= 2 && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              zIndex: 20,
              maxHeight: 520,
              overflowY: 'auto',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {loading ? (
              <Typography color="text.secondary" fontSize={13} sx={{ p: 2 }}>
                Pesquisando...
              </Typography>
            ) : total === 0 ? (
              <Box sx={{ p: 2 }}>
                <EmptyState
                  compact
                  title="Nenhum resultado"
                  description="Tente buscar por ID, título, descrição, nome, e-mail ou categoria."
                />
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {groups.map((group) => {
                  const items = results[group.key];
                  if (!items.length) {
                    return null;
                  }
                  return (
                    <Box key={group.key}>
                      <Typography
                        fontSize={11}
                        fontWeight={800}
                        color="text.secondary"
                        textTransform="uppercase"
                        sx={{ px: 2, pt: 1.5, pb: 0.5 }}
                      >
                        {group.label}
                      </Typography>
                      <List dense disablePadding>
                        {items.map((item) => (
                          <ListItemButton key={`${item.type}-${item.targetUrl}-${item.label}`} onClick={() => openResult(item)}>
                            <ListItemText
                              primary={item.label}
                              secondary={item.description}
                              primaryTypographyProps={{ fontWeight: 700 }}
                              secondaryTypographyProps={{ noWrap: true }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
