
const dashboardService = require('../services/dashboard.service');

const getStats = async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats();

        res.status(200).json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics',
            error: error.message
        });
    }
};

module.exports = { getStats };
