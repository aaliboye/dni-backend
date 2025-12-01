const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  projet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  montant: {
    type: Number,
    required: true,
    min: [0, 'Le montant doit être positif']
  },
  typeDon: {
    type: String,
    default: 'Don'
  },
  statut: {
    type: String,
    enum: ['en_attente', 'reussi', 'echoue', 'annule'],
    default: 'en_attente'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  checkoutUrl: String,
  donateur: {
    nom: String,
    email: String,
    telephone: String
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);