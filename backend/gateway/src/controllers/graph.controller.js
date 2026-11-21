
const graphService = require('../services/graph.service');

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

module.exports = { getGraph };
