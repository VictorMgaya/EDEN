"use client";

import React from 'react';
import ExpertsOnboard from '@/components/ExpertsOnboard';

export default function ExpertsOnboardPage() {
  return (
    <div className="mt-16 p-4">
      <ExpertsOnboard onStart={() => window.location.href = '/Experts'} />
    </div>
  );
}
