'use client';

import React from 'react';
import { AdminLayoutShell } from '../../../components/AdminLayoutShell';
import { GymForm } from '../../../components/GymForm';

export default function NewGymPage() {
  return (
    <AdminLayoutShell>
      <GymForm isEditing={false} />
    </AdminLayoutShell>
  );
}
