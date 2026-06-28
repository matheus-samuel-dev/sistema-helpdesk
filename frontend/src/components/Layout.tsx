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
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import Logout from '@mui/icons-material/Logout';
import Menu from '@mui/icons-material/Menu';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';
import { useAuth } from '../auth';
import { APP_NAME, APP_SHORT_DESCRIPTION } from '../config/app';
import { RoleBadge } from './Badges';
import GlobalSearch from './GlobalSearch';
import { getInitials } from '../utils/helpdesk';

const drawerWidth = 252;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
            <Menu />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: { xs: 120, sm: 260 }, maxWidth: { lg: 520 } }}>
            <GlobalSearch />
          </Box>

          <Tooltip title="Perfil do usuário">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: '#dbe8f8', color: '#1769d2', fontWeight: 800 }}>
                {getInitials(user?.name)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography fontWeight={700} fontSize={13}>
                  {user?.name}
                </Typography>
                {user?.role && <RoleBadge value={user.role} />}
              </Box>
            </Box>
          </Tooltip>
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
