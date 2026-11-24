import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

// 01 Dashboard
import { DashboardPage } from './pages/DashboardPage';

// 02 Case Management
import { InvestigationsPage } from './pages/InvestigationsPage';
import { InvestigationDetailPage } from './pages/InvestigationDetailPage';
import { SourcesPage } from './pages/SourcesPage';
import { CallRecordsPage } from './pages/CallRecordsPage';
import { TransactionsPage } from './pages/TransactionsPage';

// 03 Document Intelligence
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';

// 04 Entity Matching
import { EntitiesPage } from './pages/EntitiesPage';
import { EntityDetailPage } from './pages/EntityDetailPage';
import { MatchReviewPage } from './pages/MatchReviewPage';

// 05 Network Explorer
import { LinkAnalysisPage } from './pages/LinkAnalysisPage';
import { RelationshipsPage } from './pages/RelationshipsPage';

// 06 Alerts & Analytics
import { AlertsPage } from './pages/AlertsPage';

// 07 Audit & Administration
import { AuditLogsPage } from './pages/AuditLogsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* 01 Dashboard */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/overview" element={<Navigate to="/" replace />} />

        {/* 02 Case Management */}
        <Route path="/cases" element={<InvestigationsPage />} />
        <Route path="/cases/:id" element={<InvestigationDetailPage />} />
        <Route path="/investigations" element={<Navigate to="/cases" replace />} />
        <Route path="/investigations/:id" element={<Navigate to="/cases/:id" replace />} />

        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/call-records" element={<CallRecordsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />

        {/* 03 Document Intelligence */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/evidence" element={<Navigate to="/documents" replace />} />

        {/* 04 Entity Matching */}
        <Route path="/entities" element={<EntitiesPage />} />
        <Route path="/entities/:id" element={<EntityDetailPage />} />
        <Route path="/match-review" element={<MatchReviewPage />} />
        <Route path="/entity-matches" element={<Navigate to="/match-review" replace />} />

        {/* 05 Network Explorer */}
        <Route path="/graph" element={<LinkAnalysisPage />} />
        <Route path="/cases/:id/graph" element={<LinkAnalysisPage />} />
        <Route path="/link-analysis" element={<Navigate to="/graph" replace />} />
        <Route path="/relationships" element={<RelationshipsPage />} />

        {/* 06 Alerts & Analytics */}
        <Route path="/alerts" element={<AlertsPage />} />

        {/* 07 Audit & Administration */}
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/activity-logs" element={<Navigate to="/audit-logs" replace />} />
        <Route path="/audit" element={<Navigate to="/audit-logs" replace />} />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
