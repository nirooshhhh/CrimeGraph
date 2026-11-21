
const supabase = require('../config/supabase');

const getTableCount = async (tableName) => {
    const { count, error } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return count || 0;
};

const getDashboardStats = async () => {
    const [
        totalCases,
        totalEntities,
        totalRelationships,
        totalDocuments,
        totalAlerts
    ] = await Promise.all([
        getTableCount('cases'),
        getTableCount('entities'),
        getTableCount('relationships'),
        getTableCount('documents'),
        getTableCount('alerts')
    ]);

    return {
        totalCases,
        totalEntities,
        totalRelationships,
        totalDocuments,
        totalAlerts
    };
};

module.exports = { getDashboardStats };
