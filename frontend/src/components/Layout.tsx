import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu as MuiMenu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import Logout from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';
import { useAuth } from '../auth';
import { APP_NAME, APP_SHORT_DESCRIPTION } from '../config/app';
import GlobalSearch from './GlobalSearch';
import { ROLE_LABELS, getInitials } from '../utils/helpdesk';

const drawerWidth = 252;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuOpen = Boolean(userMenuAnchor);

  const items: Array<{ to: string; label: string; icon: ReactNode }> = [
    { to: '/dashboard', label: 'Central de operações', icon: <DashboardOutlined /> },
    { to: '/activities', label: 'Central de atividades', icon: <TimelineOutlined /> },
    { to: '/tickets', label: 'Chamados', icon: <ConfirmationNumberOutlined /> },
    { to: '/tickets/new', label: 'Novo chamado', icon: <AddCircleOutline /> },
    ...(user?.role === 'ADMIN'
      ? [{ to: '/users', label: 'Painel de gestão', icon: <PeopleOutline /> }]
      : []),
  ];

  const sidebar = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#091a31',
        color: '#b9c5d4',
        backgroundImage: 'radial-gradient(circle at top right, rgba(47, 140, 255, 0.16), transparent 28%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, px: 2.5, pt: 2.4, pb: 2 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            bgcolor: '#1769d2',
            display: 'grid',
            placeItems: 'center',
            color: 'white',
            boxShadow: '0 12px 24px rgba(23, 105, 210, 0.34)',
          }}
        >
          <HeadsetMicOutlined />
        </Box>
        <Box>
          <Typography color="white" fontWeight={800} fontSize={20}>
            {APP_NAME}
          </Typography>
          <Typography color="#91a5bf" fontSize={12}>
            {APP_SHORT_DESCRIPTION}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <List sx={{ px: 1.4, pt: 2 }}>
        {items.map(({ to, label, icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            selected={
              location.pathname === to ||
              (to === '/tickets' && /^\/tickets\/\d+$/.test(location.pathname))
            }
            onClick={() => setMobileOpen(false)}
            aria-label={label}
            sx={{
              borderRadius: 2,
              mb: 0.7,
              minHeight: 48,
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderLeft: '3px solid #2f8cff',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{icon}</ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 1.4 }}>
        <Box
          sx={{
            borderRadius: 3,
            p: 1.6,
            mb: 1.2,
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography fontSize={12} color="#91a5bf">
            {APP_SHORT_DESCRIPTION}
          </Typography>
        </Box>
        <ListItemButton
          onClick={() => {
            logout();
            navigate('/login');
          }}
          aria-label="Sair do sistema"
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          borderBottom: '1px solid #e2e8f0',
          bgcolor: 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 62, sm: 64 }, gap: { xs: 1, sm: 2 }, py: 0.7 }}>
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Abrir menu lateral"
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: { xs: 120, sm: 260 }, maxWidth: { lg: 520 } }}>
            <GlobalSearch />
          </Box>

          <Tooltip title={user ? `${user.name} · ${ROLE_LABELS[user.role]}` : 'Perfil do usuário'}>
            <Box
              component="button"
              type="button"
              onClick={(event) => setUserMenuAnchor(event.currentTarget)}
              aria-label={user ? `Abrir menu de ${user.name}` : 'Abrir menu do usuário'}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen ? 'true' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: { xs: 0, sm: 1 },
                minWidth: { xs: 38, sm: 170 },
                maxWidth: { xs: 38, sm: 220 },
                height: 44,
                px: { xs: 0, sm: 0.8 },
                py: 0.35,
                border: '1px solid transparent',
                borderRadius: 2,
                bgcolor: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit',
                transition: 'background-color .18s ease, border-color .18s ease',
                '&:hover': {
                  bgcolor: 'rgba(15, 23, 42, 0.045)',
                  borderColor: 'rgba(148, 163, 184, 0.18)',
                },
                '&:focus-visible': {
                  outline: '3px solid rgba(23, 105, 210, 0.22)',
                  outlineOffset: 2,
                },
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 36, sm: 38 },
                  height: { xs: 36, sm: 38 },
                  bgcolor: '#e8eef6',
                  color: '#0f2746',
                  fontWeight: 800,
                  fontSize: 13,
                  border: '1px solid rgba(15, 39, 70, 0.08)',
                }}
              >
                {getInitials(user?.name)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, textAlign: 'left', flex: 1 }}>
                <Typography fontWeight={650} fontSize={13.5} noWrap sx={{ lineHeight: 1.15, color: '#172033' }}>
                  {user?.name}
                </Typography>
                {user?.role && (
                  <Typography
                    fontSize={11.5}
                    color="text.secondary"
                    noWrap
                    sx={{ mt: 0.15, lineHeight: 1.2, letterSpacing: 0.1 }}
                  >
                    {ROLE_LABELS[user.role]}
                  </Typography>
                )}
              </Box>
            </Box>
          </Tooltip>

          <MuiMenu
            anchorEl={userMenuAnchor}
            open={userMenuOpen}
            onClose={() => setUserMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 238,
                  borderRadius: 2.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 18px 46px rgba(15, 23, 42, 0.14)',
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.4, maxWidth: 260 }}>
              <Typography fontWeight={700} fontSize={13.5} noWrap>
                {user?.name}
              </Typography>
              <Typography color="text.secondary" fontSize={12} noWrap>
                {user?.role ? ROLE_LABELS[user.role] : 'Perfil do usuário'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                navigate('/dashboard');
              }}
            >
              <ListItemIcon>
                <DashboardOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Central de operações" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                logout();
                navigate('/login');
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sair" />
            </MenuItem>
          </MuiMenu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}
        >
          {sidebar}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '62px', sm: '64px' },
          minWidth: 0,
        }}
      >
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
          <Outlet />
        </Box>
        <Box
          component="footer"
          sx={{
            borderTop: '1px solid #e2e8f0',
            px: { xs: 2, sm: 3 },
            py: 1.8,
            bgcolor: 'rgba(255,255,255,0.86)',
          }}
        >
          <Typography fontSize={12} color="text.secondary">
            {APP_NAME} · {APP_SHORT_DESCRIPTION}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
