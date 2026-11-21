'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayoutShell } from '../../../../components/AdminLayoutShell';
import { GymForm } from '../../../../components/GymForm';
import { useGetGymByIdQuery } from '../../../../redux/baseApi';
import { Building2, ChevronLeft } from 'lucide-react';

export default function EditGymPage() {
  const params = useParams();
  const gymId = params.id as string;

  const { data: gymData, isLoading, isError } = useGetGymByIdQuery(gymId, {
    skip: !gymId,
  });

  if (isLoading) {
    return (
      <AdminLayoutShell>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
            Loading Gym Details for Editing...
          </p>
        </div>
      </AdminLayoutShell>
    );
  }

  if (isError || !gymData?.gym) {
    return (
      <AdminLayoutShell>
        <div className="py-16 text-center">
          <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-base font-bold text-white">Gym Not Found</p>
          <Link href="/gyms" className="text-xs text-red-400 hover:underline mt-2 inline-block">
            ← Return to Fleet Directory
          </Link>
        </div>
      </AdminLayoutShell>
    );
  }

  return (
    <AdminLayoutShell>
      <GymForm initialData={gymData.gym} isEditing={true} />
    </AdminLayoutShell>
  );
}
