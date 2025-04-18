const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const monitoringService = require('./services/monitoringService');
const authRoutes = require('./routes/authRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tradeRoutes = require('./routes/tradeRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// CORS configuration for all origins
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/balances', balanceRoutes);
app.use('/api', profileRoutes);
app.use('/transactions', transactionRoutes);
app.use('/trade', tradeRoutes);

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial price data if available
    setInterval(() => {
        if (monitoringService.solKlinesPrice) {
            socket.emit('sol', monitoringService.solKlinesPrice);
        }
    }, 1000);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start monitoring services
monitoringService.startBalanceMonitoring();
monitoringService.startPriceMonitoring(io);

// Handle process termination
process.on('SIGINT', () => {
    monitoringService.stopBalanceMonitoring();
    server.close(() => {
        console.log('Server closed');
        process.exit();
    });
});

// Start the server
server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});

module.exports = app; 