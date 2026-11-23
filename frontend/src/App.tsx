import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { OverviewPage } from './pages/OverviewPage'
import { InvestigationsPage } from './pages/InvestigationsPage'
import { InvestigationDetailPage } from './pages/InvestigationDetailPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { EntitiesPage } from './pages/EntitiesPage'
import { EntityDetailPage } from './pages/EntityDetailPage'
import { MatchReviewPage } from './pages/MatchReviewPage'
import { LinkAnalysisPage } from './pages/LinkAnalysisPage'
import { ShortestPathPage } from './pages/ShortestPathPage'
import { AlertsPage } from './pages/AlertsPage'
import { CallRecordsPage } from './pages/CallRecordsPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { ActivityLogsPage } from './pages/ActivityLogsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* 1. Overview */}
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />

        {/* 2. Investigations */}
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
        <Route path="/cases" element={<Navigate to="/investigations" replace />} />
        <Route path="/cases/:id" element={<Navigate to="/investigations/:id" replace />} />

        {/* 3. Evidence & Documents */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/evidence" element={<Navigate to="/documents" replace />} />

        {/* 4. Entities */}
        <Route path="/entities" element={<EntitiesPage />} />
        <Route path="/entities/:id" element={<EntityDetailPage />} />

        {/* 5. Entity Match Review */}
        <Route path="/entity-matches" element={<MatchReviewPage />} />
        <Route path="/match-review" element={<Navigate to="/entity-matches" replace />} />

        {/* 6. Link Analysis (Signature feature) */}
        <Route path="/link-analysis" element={<LinkAnalysisPage />} />
        <Route path="/graph" element={<Navigate to="/link-analysis" replace />} />

        {/* 7. Shortest Path */}
        <Route path="/shortest-path" element={<ShortestPathPage />} />

        {/* 8. Alerts */}
        <Route path="/alerts" element={<AlertsPage />} />

        {/* 9. Call Records */}
        <Route path="/call-records" element={<CallRecordsPage />} />

        {/* 10. Transactions */}
        <Route path="/transactions" element={<TransactionsPage />} />

        {/* 11. Activity Logs */}
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/audit" element={<Navigate to="/activity-logs" replace />} />

        {/* 12. Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}
