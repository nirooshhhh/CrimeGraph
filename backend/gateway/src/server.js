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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CrimeGraph API running on http://localhost:${PORT}`);
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
