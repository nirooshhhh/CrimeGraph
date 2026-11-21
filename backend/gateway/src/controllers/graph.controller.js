
const graphService = require('../services/graph.service');

const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://127.0.0.1:8001';

const getGraph = async (req, res) => {
    try {
        const { caseId } = req.params;
        const graph = await graphService.getGraphData(caseId);

        res.status(200).json({
            success: true,
            caseId,
            nodeCount: graph.nodes.length,
            edgeCount: graph.edges.length,
            data: graph
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Analyze a case graph using Python Graph Service
const analyzeGraph = async (req, res) => {
    try {
        const { caseId } = req.params;
        const graph = await graphService.getGraphData(caseId);

        const response = await fetch(`${GRAPH_SERVICE_URL}/api/graph/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(graph)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || 'Graph analysis failed');
        }

        res.status(200).json({
            success: true,
            caseId,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Find shortest path between two entities in a case
const shortestPath = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { start_id, end_id } = req.body;

        if (!start_id || !end_id) {
            return res.status(400).json({
                success: false,
                message: 'start_id and end_id are required'
            });
        }

        const graph = await graphService.getGraphData(caseId);

        const response = await fetch(
            `${GRAPH_SERVICE_URL}/api/graph/shortest-path`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...graph,
                    start_id,
                    end_id
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || 'Shortest path calculation failed');
        }

        res.status(200).json({
            success: true,
            caseId,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getGraph,
    analyzeGraph,
    shortestPath
};
