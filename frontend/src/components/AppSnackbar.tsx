import { Alert, Snackbar, type AlertColor } from '@mui/material';

export type FeedbackState = {
  open: boolean;
  message: string;
  severity?: AlertColor;
};

type Props = {
  feedback: FeedbackState;
  onClose: () => void;
};

export const initialFeedback: FeedbackState = {
  open: false,
  message: '',
  severity: 'success',
};

export default function AppSnackbar({ feedback, onClose }: Props) {
  return (
    <Snackbar
      open={feedback.open}
      autoHideDuration={4200}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={feedback.severity ?? 'success'}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {feedback.message}
      </Alert>
    </Snackbar>
  );
}
