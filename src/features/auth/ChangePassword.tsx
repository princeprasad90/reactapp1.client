import React from 'react';
import * as yup from 'yup';
import { useFormCommand } from '../../hooks/useFormCommand';
import { validateRelatedFields } from '../../utils/validation';
import { apiFetch } from '../../services/api';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const submit = useFormCommand({
    schema: yup.object({
      currentPassword: yup.string().required('Current password is required'),
      newPassword: yup
        .string()
        .required('New password is required')
        .min(6, 'Minimum 6 characters')
        .test('different', 'New password must differ', function (value) {
          const current = this.parent.currentPassword;
          return !validateRelatedFields(current, value || '', (a, b) => a !== b, 'diff');
        }),
    }),
    api: async (values: { currentPassword: string; newPassword: string }) => {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: values
      });
      if (res.status < 200 || res.status >= 300) throw new Error('Could not change password');
    },
    onSuccess: () => setSuccess(true)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const { errors } = await submit({ currentPassword, newPassword });
    if (errors) {
      setError(Array.isArray(errors) ? errors.join(', ') : String(errors));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Current Password</label>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
      </div>
      <div>
        <label>New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </div>
      {error && <div style={{color:'red'}}>{error}</div>}
      {success && <div>Password changed</div>}
      <button type="submit">Change Password</button>
    </form>
  );
};

export default ChangePassword;
