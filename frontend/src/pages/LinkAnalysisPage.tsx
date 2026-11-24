import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Layers,
  Activity,
  Route,
  ArrowRight,
  ExternalLink,
  Shield,
  X,
  AlertTriangle,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  fetchCases,
  fetchGraphByCase,
  analyzeGraphByCase,
  findShortestPath,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/FormFields';
import { EntityTypeBadge, StatusBadge, VerificationBadge } from '../components/common/Badge';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { GraphNode, GraphEdge, EntityType } from '../types';

const entityColors: Record<string, string> = {
  person: '#818CF8',
  phone: '#34D399',
  vehicle: '#FB923C',
  location: '#38BDF8',
  organization: '#E879F9',
  account: '#FACC15',
  other: '#94A3B8',
};

export const LinkAnalysisPage: React.FC = () => {
  const { id: paramCaseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Active case selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>(paramCaseId || '');

  // Keep state in sync with URL
  useEffect(() => {
    if (paramCaseId && paramCaseId !== selectedCaseId) {
      setSelectedCaseId(paramCaseId);
    }
  }, [paramCaseId]);

  // Collapsible panels
  const [activeSidePanel, setActiveSidePanel] = useState<'details' | 'analytics' | 'path' | null>('analytics');
  const [selectedNodeData, setSelectedNodeData] = useState<GraphNode | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<GraphEdge | null>(null);

  // Shortest path inputs
  const [pathStartId, setPathStartId] = useState('');
  const [pathEndId, setPathEndId] = useState('');
  const [shortestPathResult, setShortestPathResult] = useState<{
    path: string[];
    distance: number | null;
    message?: string;
  } | null>(null);

  // Type filter in floating toolbar
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>({
    person: true,
    phone: true,
    vehicle: true,
    location: true,
    organization: true,
    account: true,
    other: true,
  });

  // Query all cases for the case switcher
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  // Auto-select first case if on /graph and none chosen
  useEffect(() => {
    if (!selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases, selectedCaseId]);

  // Query Graph data
  const {
    data: graphResponse,
    isLoading: graphLoading,
    error: graphError,
    refetch: refetchGraph,
  } = useQuery({
    queryKey: ['graph', 'case', selectedCaseId],
    queryFn: () => fetchGraphByCase(selectedCaseId),
    enabled: !!selectedCaseId,
  });

  // Query Graph Analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['graph', 'case', selectedCaseId, 'analyze'],
    queryFn: () => analyzeGraphByCase(selectedCaseId),
    enabled: !!selectedCaseId,
    retry: 1,
  });

  const nodes = graphResponse?.data?.nodes || [];
  const edges = graphResponse?.data?.edges || [];

  // Shortest path mutation
  const shortestPathMutation = useMutation({
    mutationFn: () => findShortestPath(selectedCaseId, pathStartId, pathEndId),
    onSuccess: (res) => {
      setShortestPathResult(res);
      // Highlight in cytoscape
      if (cyRef.current && res.path && res.path.length > 0) {
        cyRef.current.elements().removeClass('highlighted-path');
        const selector = res.path.map((id) => `node[id = "${id}"]`).join(', ');
        cyRef.current.$(selector).addClass('highlighted-path');
      } else {
        if (cyRef.current) cyRef.current.elements().removeClass('highlighted-path');
      }
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      if (msg.includes('500') || msg.toLowerCase().includes('network')) {
        toastError('Graph service unavailable (port 8001)', 'Shortest Path Error');
      } else {
        toastError(msg, 'Shortest Path Error');
      }
    },
  });

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    // Filter nodes by enabled types
    const filteredNodes = nodes.filter((n) => enabledTypes[n.type] !== false);
    const validNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Only include edges where both ends are in filtered nodes
    const filteredEdges = edges.filter(
      (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    const elements: cytoscape.ElementDefinition[] = [
      ...filteredNodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label || n.id.slice(0, 8),
          type: n.type,
          color: entityColors[n.type] || '#94A3B8',
          verification: n.verification_status || 'unverified',
          raw: n,
        },
      })),
      ...filteredEdges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || 'related_to',
          status: e.status || 'under_review',
          confidence: e.confidence ?? 0.5,
          raw: e,
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': 'data(color)',
            color: '#F8FAFC',
            'font-family': 'Inter, sans-serif',
            'font-size': '13px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-outline-color': '#0F1115',
            'text-outline-width': 3,
            width: 38,
            height: 38,
            'border-width': 2,
            'border-color': '#262B35',
            'transition-property': 'background-color, border-color, border-width',
            'transition-duration': 150,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#0EA5E9',
            'border-opacity': 1,
            'underlay-color': '#0EA5E9',
            'underlay-padding': 6,
            'underlay-opacity': 0.3,
          },
        },
        {
          selector: 'node.highlighted-path',
          style: {
            'border-width': 4,
            'border-color': '#10B981',
            'underlay-color': '#10B981',
            'underlay-padding': 8,
            'underlay-opacity': 0.4,
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'curve-style': 'bezier',
            'line-color': '#363C48',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#363C48',
            'font-size': '10px',
            color: '#94A3B8',
            'text-background-color': '#171A21',
            'text-background-opacity': 0.85,
            'text-background-padding': '2px',
            'text-rotation': 'autorotate',
            'line-style': 'solid',
            width: 'mapData(confidence, 0, 1, 1.5, 4)',
            opacity: 0.85,
          },
        },
        {
          selector: 'edge[status = "under_review"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#0EA5E9',
            'target-arrow-color': '#0EA5E9',
            width: 4,
            opacity: 1,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 100,
      },
    });

    // Events
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      setSelectedNodeData(node.data('raw'));
      setSelectedEdgeData(null);
      setActiveSidePanel('details');
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      setSelectedEdgeData(edge.data('raw'));
      setSelectedNodeData(null);
      setActiveSidePanel('details');
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNodeData(null);
        setSelectedEdgeData(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges, enabledTypes]);

  // Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  const handleHighlightGroup = (groupNodeIds: string[]) => {
    if (!cyRef.current) return;
    cyRef.current.elements().unselect();
    cyRef.current.elements().removeClass('highlighted-path');
    const sel = groupNodeIds.map((id) => `node[id = "${id}"]`).join(', ');
    cyRef.current.$(sel).select();
    cyRef.current.fit(cyRef.current.$(sel), 60);
  };

  const handleCaseChange = (newCaseId: string) => {
    setSelectedCaseId(newCaseId);
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    setShortestPathResult(null);
    if (paramCaseId) {
      navigate(`/cases/${newCaseId}/graph`);
    }
  };

  // Check if graph service is down
  const isGraphServiceDown =
    (graphError && getErrorMessage(graphError).includes('500')) ||
    (analyticsError && getErrorMessage(analyticsError).includes('500'));

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-100px)]">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Network Link Analysis</h2>
            <p className="text-xs text-text-secondary">
              Interactive entity-relationship graph, degree centrality, and shortest-path calculation.
            </p>
          </div>
        </div>

        {/* Case Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-muted whitespace-nowrap">Case File:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => handleCaseChange(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-w-[240px]"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Canvas & Collapsible Side Panel Area */}
      <div className="flex-1 min-h-0 flex gap-4 relative overflow-hidden">
        {/* Graph Canvas Container */}
        <div className="flex-1 bg-[#0F1115] border border-border rounded-panel relative overflow-hidden">
          {/* Floating Controls Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-surface/90 backdrop-blur-md p-1.5 rounded-lg border border-border shadow-elevated">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
              title="Fit to Screen"
              aria-label="Fit graph to view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={() => setActiveSidePanel(activeSidePanel === 'analytics' ? null : 'analytics')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeSidePanel === 'analytics'
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Metrics</span>
            </button>
            <button
              onClick={() => setActiveSidePanel(activeSidePanel === 'path' ? null : 'path')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeSidePanel === 'path'
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Shortest Path</span>
            </button>
          </div>

          {/* Floating Legend Toolbar */}
          <div className="absolute bottom-4 left-4 z-20 bg-surface/90 backdrop-blur-md px-3 py-2 rounded-lg border border-border shadow-elevated flex items-center gap-3 text-xs text-text-muted flex-wrap">
            <span className="font-semibold text-text-secondary">Entity Legend:</span>
            {Object.entries(entityColors).map(([t, color]) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enabledTypes[t] !== false}
                  onChange={(e) => setEnabledTypes({ ...enabledTypes, [t]: e.target.checked })}
                  className="rounded border-border text-accent focus:ring-0 bg-surface-raised w-3 h-3"
                />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize text-[11px] text-text-secondary">{t}</span>
              </label>
            ))}
            <div className="h-3 w-px bg-border mx-1" />
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-[#94A3B8]" /> Confirmed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-[#FBBF24]" /> Under Review
              </span>
            </div>
          </div>

          {/* Graph Service Unavailable Warning */}
          {isGraphServiceDown && (
            <div className="absolute top-4 right-4 z-20 max-w-sm p-3 rounded-lg bg-status-error/15 border border-status-error/30 text-xs text-status-error flex items-start gap-2 shadow-elevated">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Graph service unavailable (port 8001)</strong>
                Start graph-service to enable path calculation and network metrics.
              </div>
            </div>
          )}

          {/* Empty State */}
          {!graphLoading && nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
              <Network className="w-12 h-12 text-text-muted mb-3" />
              <div className="text-base font-semibold text-text-primary">
                No entities or relationships linked to this investigation yet
              </div>
              <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4">
                Link entities from the investigation case page or upload evidence files to populate the network.
              </p>
              {selectedCaseId && (
                <Button size="sm" onClick={() => navigate(`/cases/${selectedCaseId}`)}>
                  Go to Investigation Page
                </Button>
              )}
            </div>
          )}

          {/* Canvas */}
          <div ref={containerRef} className="cytoscape-container" />
        </div>

        {/* Collapsible Side Panel (Details, Analytics, Shortest Path) */}
        {activeSidePanel && (
          <div className="w-80 md:w-96 bg-surface border border-border rounded-panel flex flex-col shrink-0 shadow-elevated animate-slide-in-right overflow-hidden">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {activeSidePanel === 'details' && <Layers className="w-4 h-4 text-accent" />}
                {activeSidePanel === 'analytics' && <Activity className="w-4 h-4 text-accent" />}
                {activeSidePanel === 'path' && <Route className="w-4 h-4 text-accent" />}
                <span className="text-sm font-semibold text-text-primary">
                  {activeSidePanel === 'details' && (selectedNodeData ? 'Entity Inspector' : 'Relationship Inspector')}
                  {activeSidePanel === 'analytics' && 'Graph Analytics'}
                  {activeSidePanel === 'path' && 'Shortest Path Finder'}
                </span>
              </div>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-raised"
                aria-label="Close side panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* DETAILS PANEL: Node or Edge */}
              {activeSidePanel === 'details' && (
                <>
                  {selectedNodeData && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <EntityTypeBadge type={selectedNodeData.type} />
                          <VerificationBadge status={selectedNodeData.verification_status} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">{selectedNodeData.label}</h3>
                        <div className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                          ID: {selectedNodeData.id}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="text-xs font-semibold uppercase text-text-muted mb-2">Attributes:</div>
                        {!selectedNodeData.attributes || Object.keys(selectedNodeData.attributes).length === 0 ? (
                          <div className="text-xs text-text-muted">No custom attributes recorded.</div>
                        ) : (
                          <div className="space-y-1.5">
                            {Object.entries(selectedNodeData.attributes).map(([k, v]) => (
                              <div key={k} className="p-2 rounded bg-surface-raised text-xs flex justify-between">
                                <span className="text-text-muted font-mono">{k}:</span>
                                <span className="text-text-primary font-semibold">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border">
                        <Link to={`/entities/${selectedNodeData.id}`} className="w-full block">
                          <Button size="sm" className="w-full" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                            Open Full Entity Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {selectedEdgeData && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-semibold uppercase text-text-muted mb-1">Relationship Link</div>
                        <h3 className="text-base font-bold text-text-primary capitalize">
                          {selectedEdgeData.label}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge status={selectedEdgeData.status} />
                          <span className="text-xs text-text-muted">
                            Confidence:{' '}
                            <strong className="text-text-primary">
                              {selectedEdgeData.confidence !== null && selectedEdgeData.confidence !== undefined
                                ? `${Math.round(selectedEdgeData.confidence * 100)}%`
                                : '—'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-2 text-xs">
                        <div>
                          <span className="text-text-muted block">Source Entity:</span>
                          <Link to={`/entities/${selectedEdgeData.source}`} className="text-accent hover:underline font-mono">
                            {selectedEdgeData.source}
                          </Link>
                        </div>
                        <div>
                          <span className="text-text-muted block">Target Entity:</span>
                          <Link to={`/entities/${selectedEdgeData.target}`} className="text-accent hover:underline font-mono">
                            {selectedEdgeData.target}
                          </Link>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link to="/relationships" className="w-full block">
                          <Button size="sm" variant="secondary" className="w-full" icon={<Share2 className="w-3.5 h-3.5" />}>
                            Manage in Relationships
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {!selectedNodeData && !selectedEdgeData && (
                    <div className="text-center py-8 text-xs text-text-muted">
                      Click any entity node or connecting edge in the canvas to inspect its parameters.
                    </div>
                  )}
                </>
              )}

              {/* ANALYTICS PANEL: From /analyze */}
              {activeSidePanel === 'analytics' && (
                <div className="space-y-4">
                  {analyticsError ? (
                    <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/30 text-xs text-status-error">
                      Graph service unavailable (port 8001). Network metrics could not be computed.
                    </div>
                  ) : analyticsLoading ? (
                    <div className="py-8 text-center text-xs text-text-muted animate-pulse">
                      Computing network analytics...
                    </div>
                  ) : (
                    <>
                      {/* Metric Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-center">
                          <div className="text-[10px] text-text-muted uppercase">Nodes</div>
                          <div className="text-lg font-bold text-text-primary tabular-nums mt-0.5">
                            {analyticsData?.node_count || 0}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-center">
                          <div className="text-[10px] text-text-muted uppercase">Edges</div>
                          <div className="text-lg font-bold text-text-primary tabular-nums mt-0.5">
                            {analyticsData?.edge_count || 0}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-center">
                          <div className="text-[10px] text-text-muted uppercase">Clusters</div>
                          <div className="text-lg font-bold text-text-primary tabular-nums mt-0.5">
                            {analyticsData?.connected_group_count || 0}
                          </div>
                        </div>
                      </div>

                      {/* Top Nodes by Degree Centrality */}
                      <div>
                        <div className="text-xs font-semibold uppercase text-text-muted mb-2">
                          Top Entities by Connections:
                        </div>
                        <div className="space-y-1.5">
                          {analyticsData?.connections &&
                            Object.entries(analyticsData.connections)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 5)
                              .map(([nId, degree]) => {
                                const nodeObj = nodes.find((n) => n.id === nId);
                                const label = nodeObj?.label || nId.slice(0, 8);
                                return (
                                  <div
                                    key={nId}
                                    onClick={() => handleHighlightGroup([nId])}
                                    className="p-2 rounded bg-surface-raised hover:bg-surface-raised/80 border border-border flex items-center justify-between text-xs cursor-pointer transition-colors"
                                  >
                                    <span className="font-medium text-text-primary truncate">{label}</span>
                                    <span className="font-mono text-accent font-bold tabular-nums">
                                      {degree} links
                                    </span>
                                  </div>
                                );
                              })}
                        </div>
                      </div>

                      {/* Connected Groups */}
                      <div>
                        <div className="text-xs font-semibold uppercase text-text-muted mb-2">
                          Connected Clusters ({analyticsData?.connected_groups?.length || 0}):
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {analyticsData?.connected_groups?.map((group, idx) => {
                            const isSingleton = group.length === 1;
                            return (
                              <div
                                key={idx}
                                onClick={() => handleHighlightGroup(group)}
                                className="p-2 rounded bg-surface-raised hover:border-accent/40 border border-border flex items-center justify-between text-xs cursor-pointer transition-colors"
                              >
                                <span className="font-medium text-text-primary">Cluster #{idx + 1}</span>
                                <div className="flex items-center gap-1.5">
                                  {isSingleton ? (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-text-muted">
                                      isolated
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/25">
                                      {group.length} nodes
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SHORTEST PATH PANEL: From /shortest-path */}
              {activeSidePanel === 'path' && (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Compute the minimum degree path between two entities in this case graph.
                  </p>

                  <div className="space-y-3">
                    <Select
                      label="Start Entity"
                      required
                      value={pathStartId}
                      onChange={(e) => setPathStartId(e.target.value)}
                    >
                      <option value="">-- Choose start node --</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label} ({n.type})
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Destination Entity"
                      required
                      value={pathEndId}
                      onChange={(e) => setPathEndId(e.target.value)}
                    >
                      <option value="">-- Choose end node --</option>
                      {nodes
                        .filter((n) => n.id !== pathStartId)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label} ({n.type})
                          </option>
                        ))}
                    </Select>

                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!pathStartId || !pathEndId}
                      isLoading={shortestPathMutation.isPending}
                      onClick={() => shortestPathMutation.mutate()}
                      icon={<Route className="w-3.5 h-3.5" />}
                    >
                      Calculate Shortest Path
                    </Button>
                  </div>

                  {shortestPathResult && (
                    <div className="pt-3 border-t border-border space-y-3 animate-fade-in">
                      {shortestPathResult.distance === null || shortestPathResult.path.length === 0 ? (
                        <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-xs text-text-secondary text-center">
                          {shortestPathResult.message || 'No connection found between these entities (distance: null).'}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-surface-raised border border-status-success/30 text-xs space-y-2">
                          <div className="flex items-center justify-between text-status-success font-semibold">
                            <span>Connection Found</span>
                            <span className="font-mono tabular-nums">{shortestPathResult.distance} Hops</span>
                          </div>
                          <div className="space-y-1 pt-1">
                            {shortestPathResult.path.map((nodeId, idx) => {
                              const nObj = nodes.find((n) => n.id === nodeId);
                              return (
                                <div key={nodeId} className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-mono">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium text-text-primary">
                                    {nObj?.label || nodeId.slice(0, 8)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
