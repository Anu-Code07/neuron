import { Suspense } from 'react';
import { AppExperience } from '@/components/app-experience';

function AppLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#05080D] text-[#737373]">
      Loading Neuron…
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={<AppLoading />}>
      <AppExperience />
    </Suspense>
  );
}
