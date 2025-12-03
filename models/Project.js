const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du projet est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  objectifSolde: {
    type: Number,
    required: [false, 'L\'objectif de collecte est requis'],
    min: [0, 'L\'objectif doit être positif']
  },
  soldeActuel: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [{
    url: String,
    publicId: String
  }],
  actif: {
    type: Boolean,
    default: true
  },
  limit: {
    type: Boolean,
    default: false
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateFin: {
    type: Date
  }
}, {
  timestamps: true
});

// Méthode virtuelle pour calculer le pourcentage
projectSchema.virtual('pourcentage').get(function() {
  return this.objectifSolde > 0 
    ? Math.round((this.soldeActuel / this.objectifSolde) * 100) 
    : 0;
});

// S'assurer que les virtuels sont inclus
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);