const entityAliasesRoutes = require('./routes/entityAliases.routes');
const entityMatchCandidatesRoutes =
    require('./routes/entityMatchCandidates.routes');
const auditLogsRoutes = require('./routes/auditLogs.routes');
const alertsRoutes = require('./routes/alerts.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const callRecordsRoutes = require('./routes/callRecords.routes');
const sourcesRoutes = require('./routes/sources.routes');
const documentsRoutes = require('./routes/documents.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const graphRoutes = require('./routes/graph.routes');
const relationshipsRoutes = require('./routes/relationships.routes');
const entitiesRoutes = require('./routes/entities.routes');
const casesRoutes = require('./routes/cases.routes');
const express = require('express');
const cors = require('cors');
require('dotenv').config({
    path: require('path').resolve(__dirname, '../../../.env')
});

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/cases', casesRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/relationships', relationshipsRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/call-records', callRecordsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/entity-match-candidates', entityMatchCandidatesRoutes);
app.use('/api/entity-aliases', entityAliasesRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CrimeGraph Backend is running',
        status: 'OK'
    });
});

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to CrimeGraph API');
});


const supabase = require('./config/supabase');

// Test Supabase connection
app.get('/api/db-check', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('id')
            .limit(1);

        if (error) {
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Supabase database connected successfully',
            recordsFound: data.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CrimeGraph API running on http://localhost:${PORT}`);
});