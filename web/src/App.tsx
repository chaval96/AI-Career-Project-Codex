import { Navigate, Route, Routes } from 'react-router-dom';

import { AppRouteGuard, OnboardingRouteGuard } from './components/RouteGuards';
import { AppLayout } from './layouts/AppLayout';
import { OnboardingLayout } from './layouts/OnboardingLayout';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AssessmentsPage } from './pages/app/AssessmentsPage';
import { BlueprintPage } from './pages/app/BlueprintPage';
import { DashboardPage } from './pages/app/DashboardPage';
import { PlanPage } from './pages/app/PlanPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { SettingsPage } from './pages/app/SettingsPage';
import { ConfirmPage } from './pages/onboarding/ConfirmPage';
import { ConsentPage } from './pages/onboarding/ConsentPage';
import { FirstTestPage } from './pages/onboarding/FirstTestPage';
import { GoalsPage } from './pages/onboarding/GoalsPage';
import { QuickPreferencesPage } from './pages/onboarding/QuickPreferencesPage';
import { UploadPage } from './pages/onboarding/UploadPage';

const debugUiEnabled = import.meta.env.VITE_DEBUG_UI === 'true';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />

      <Route path="/onboarding" element={<OnboardingLayout />}>
        <Route
          path="consent"
          element={
            <OnboardingRouteGuard step="consent">
              <ConsentPage />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="goals"
          element={
            <OnboardingRouteGuard step="goals">
              <GoalsPage />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="upload"
          element={
            <OnboardingRouteGuard step="upload">
              <UploadPage />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="confirm"
          element={
            <OnboardingRouteGuard step="confirm">
              <ConfirmPage />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="quick-preferences"
          element={
            <OnboardingRouteGuard step="quick-preferences">
              <QuickPreferencesPage />
            </OnboardingRouteGuard>
          }
        />
        <Route
          path="first-test"
          element={
            <OnboardingRouteGuard step="first-test">
              <FirstTestPage />
            </OnboardingRouteGuard>
          }
        />
      </Route>

      <Route
        path="/app"
        element={
          <AppRouteGuard>
            <AppLayout />
          </AppRouteGuard>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="blueprint" element={<BlueprintPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {debugUiEnabled ? <Route path="/admin" element={<AdminPage />} /> : null}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
