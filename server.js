// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');

// const app = express();

// // CORS 100% ouvert
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Static
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('MongoDB connecté'))
//   .catch(err => {
//     console.error('Erreur MongoDB:', err);
//     process.exit(1);
//   });

// // Routes
// app.use('/api/projects', require('./routes/projects'));
// app.use('/api/donations', require('./routes/donations'));

// // Health endpoint (corrigé)
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'ok',
//     mongodb: mongoose.connection.readyState === 1 ? 'connecté' : 'déconnecté',
//     timestamp: new Date().toISOString()
//   });
// });

// module.exports = app;


// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');

// const app = express();



// // Middleware
// // Middleware
// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));
// app.options('*', cors());
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// // Servir les fichiers statiques (images uploadées)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Connexion MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('✅ MongoDB connecté'))
//   .catch(err => {
//     console.error('❌ Erreur MongoDB:', err);
//     process.exit(1);
//   });

// // Routes
// app.use('/api/projects', require('./routes/projects'));
// app.use('/api/donations', require('./routes/donations'));

// // Route de santé
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'ok', 
//     mongodb: mongoose.connection.readyState === 1 ? 'connecté' : 'déconnecté',
//     timestamp: new Date().toISOString()
//   });
// });

// // Route d'accueil
// app.get('/', (req, res) => {
//   res.json({ 
//     message: 'API DNI Donations',
//     version: '1.0.0',
//     endpoints: {
//       health: '/health',
//       projects: '/api/projects',
//       donations: '/api/donations'
//     }
//   });
// });

// // Gestion des erreurs
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     error: 'Erreur serveur',
//     message: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // 404
// app.use((req, res) => {
//   res.status(404).json({ error: 'Route non trouvée' });
// });

// // Démarrage du serveur
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Serveur démarré sur le port ${PORT}`);
//   console.log(`📍 URL: http://localhost:${PORT}`);
// });