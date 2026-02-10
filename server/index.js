
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Debug logger
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// --- ROUTES ---

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', timestamp: new Date().toISOString() });
});

// 2. AI Chatbot Proxy
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'AI API Key not configured on server' });
        }

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are BuildWise, an expert construction assistant. Provide technical, accurate, and professional advice on project planning, labor, budgets, and safety.',
                },
                ...messages
            ],
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Chat Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

// 3. Project Scenarios (Supabase Bridge)
app.get('/api/scenarios', async (req, res) => {
    const { data, error } = await supabase.from('project_scenarios').select('*');
    if (error) return res.status(400).json(error);
    res.json(data);
});

app.post('/api/scenarios', async (req, res) => {
    const { scenario_data, type } = req.body;
    const { data, error } = await supabase.from('project_scenarios').insert([{
        scenario_type: type,
        data: scenario_data,
        created_at: new Date()
    }]);

    if (error) return res.status(400).json(error);
    res.json(data);
});

// 4. Material Expense Tracking
app.get('/api/expenses', async (req, res) => {
    const { data, error } = await supabase.from('materials').select('name, quantity, cost_per_unit');
    if (error) return res.status(400).json(error);
    res.json(data);
});

// 5. BIM Converter Proxy
app.post('/api/bim/convert', async (req, res) => {
    console.log('========== BIM CONVERSION REQUEST RECEIVED ==========');
    try {
        const { image, scaleFactor = 0.05 } = req.body;
        console.log('Image data length:', image ? image.length : 'NO IMAGE');
        console.log('Scale factor:', scaleFactor);

        if (!image) return res.status(400).json({ error: 'No image data provided' });

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            console.log('Creating temp directory:', tempDir);
            fs.mkdirSync(tempDir);
        }

        const requestId = Date.now();
        const inputPath = path.join(tempDir, `input_${requestId}.png`);
        const outputPath = path.join(tempDir, `output_${requestId}.json`);

        console.log('Input path:', inputPath);
        console.log('Output path:', outputPath);

        // Save base64 image to file
        console.log('Decoding base64 image...');
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(inputPath, base64Data, 'base64');
        console.log('Image saved successfully. File size:', fs.statSync(inputPath).size, 'bytes');

        // Execute Python script
        const scriptPath = path.join(__dirname, '..', 'scripts', 'blueprint_to_3d_bim.py');
        console.log('Script path:', scriptPath);

        // Try 'python' then 'python3'
        const command = `python "${scriptPath}" "${inputPath}" "${outputPath}"`;

        console.log(`Executing command: ${command}`);

        exec(command, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            console.log('Python execution completed');
            console.log('STDOUT:', stdout);
            console.log('STDERR:', stderr);

            if (error) {
                console.error(`BIM Exec Error (python): ${error.message}`);

                // Try fallback to python3 if python failed
                exec(`python3 "${scriptPath}" "${inputPath}" "${outputPath}"`, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error3, stdout3, stderr3) => {
                    console.log('Python3 execution completed');
                    console.log('STDOUT3:', stdout3);
                    console.log('STDERR3:', stderr3);

                    if (error3) {
                        console.error(`BIM Exec Error (python3): ${error3.message}`);
                        return res.status(500).json({
                            error: 'BIM engine failed. Python is required but not found or OpenCV is missing.',
                            details: stderr3 || error3.message
                        });
                    }
                    finalizeBimResponse();
                });
                return;
            }
            finalizeBimResponse();
        });

        function finalizeBimResponse() {
            console.log('Finalizing BIM response...');

            if (!fs.existsSync(outputPath)) {
                console.error('Output file not found:', outputPath);
                return res.status(500).json({ error: 'BIM engine did not produce an output file' });
            }

            console.log('Output file exists. Size:', fs.statSync(outputPath).size, 'bytes');

            // Read results
            const resultData = fs.readFileSync(outputPath, 'utf8');
            console.log('Result data read. Parsing JSON...');
            const bimData = JSON.parse(resultData);
            console.log('BIM data parsed successfully. Rooms:', bimData.rooms?.length);

            // Cleanup
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                console.log('Temp files cleaned up');
            } catch (e) {
                console.error("Cleanup error:", e);
            }

            console.log('Sending BIM response to client');
            res.json(bimData);
            console.log('========== BIM CONVERSION COMPLETE ==========');
        }
    } catch (error) {
        console.error('========== BIM CONVERSION ERROR ==========');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Server error during BIM conversion', details: error.message });
    }
});


// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BuildWise Backend running at http://localhost:${PORT}`);
});
