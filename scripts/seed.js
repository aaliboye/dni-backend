const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('../models/Project');

const seedProjects = [
  {
    nom: "Logement",
    description: "Projet de construction d'un nouveau internat",
    objectifSolde: 400000000
  },
  {
    nom: "Restauration",
    description: "Nourrir les talibés",
    objectifSolde: 200000000
  },

];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    await Project.deleteMany({});
    console.log('🗑️  Anciennes données supprimées');

    await Project.insertMany(seedProjects);
    console.log('✅ Données de test insérées avec succès');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seed();