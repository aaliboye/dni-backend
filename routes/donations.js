const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Project = require('../models/Project');

// POST créer un don
router.post('/create', async (req, res) => {
  try {
    const { projetId, montant, typeDon, donateur } = req.body;

    if (!projetId || !montant || montant <= 0) {
      return res.status(400).json({ 
        error: 'Projet ID et montant valide requis' 
      });
    }

    const project = await Project.findById(projetId);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    if (!project.actif) {
      return res.status(400).json({ error: 'Ce projet n\'accepte plus de dons' });
    }

    const donation = new Donation({
      projet: projetId,
      montant: Number(montant),
      typeDon: typeDon || 'Don',
      donateur: donateur || {}
    });

    await donation.save();

    // Appel API NabooPay
    const nabooResponse = await fetch(
      `${process.env.NABOO_API_URL}/transaction/create-transaction`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.NABOO_TOKEN}`
        },
        body: JSON.stringify({
          method_of_payment: ['WAVE', 'ORANGE_MONEY', 'bank'],
          products: [{
            name: project.nom,
            category: typeDon || 'Don',
            amount: Number(montant),
            quantity: 1,
            description: `Don pour ${project.nom}`
          }],
          success_url: `${process.env.SUCCESS_URL}?status=success&donationId=${donation._id}&amount=${montant}`,
          error_url: `${process.env.ERROR_URL}?status=error&donationId=${donation._id}`,
          fees_customer_side: true,
          is_escrow: false,
          is_merchant: false
        })
      }
    );

    if (!nabooResponse.ok) {
      const errorText = await nabooResponse.text();
      console.error('Erreur NabooPay:', errorText);
      
      donation.statut = 'echoue';
      await donation.save();
      
      return res.status(500).json({ 
        error: 'Erreur lors de l\'initialisation du paiement',
        details: errorText
      });
    }

    const nabooResult = await nabooResponse.json();

    donation.transactionId = nabooResult.transaction_id || nabooResult.id;
    donation.checkoutUrl = nabooResult.checkout_url;
    await donation.save();

    res.status(201).json({
      success: true,
      donation: donation,
      checkoutUrl: nabooResult.checkout_url,
      transactionId: donation.transactionId
    });

  } catch (error) {
    console.error('Erreur création don:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// POST callback
// router.post('/callback', async (req, res) => {
//   try {
//     const { donationId, status, transactionId } = req.body;

//     const donation = await Donation.findById(donationId);
//     if (!donation) {
//       return res.status(404).json({ error: 'Don non trouvé' });
//     }

//     if (status === 'success') {
//       donation.statut = 'reussi';
      
//       const project = await Project.findById(donation.projet);
//       if (project) {
//         console.log('donnation montant', donation.montant);
        
//         project.soldeActuel += donation.montant;
//         console.log('projet solde', project.soldeActuel);
        
//         await project.save();
//       }
//     } else if (status === 'error') {
//       donation.statut = 'echoue';
//     }

//     if (transactionId) {
//       donation.transactionId = transactionId;
//     }

//     await donation.save();

//     res.json({ 
//       success: true, 
//       donation,
//       message: status === 'success' ? 'Don confirmé' : 'Paiement échoué'
//     });

//   } catch (error) {
//     console.error('Erreur callback:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// POST callback sécurisé
router.post('/callback', async (req, res) => {
  try {
    const { donationId, status, transactionId } = req.body;

    // Vérif paramètres
    if (!donationId || !status) {
      return res.status(400).json({ error: 'Paramètres invalides' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ error: 'Don non trouvé' });
    }

    // ⛔ Empêcher double traitement
    if (donation.statut === 'reussi') {
      return res.json({
        success: true,
        message: "Donation déjà confirmée — aucun changement.",
        donation
      });
    }

    if (status === 'success') {
      // Marquer comme payé
      donation.statut = 'reussi';

      if (transactionId) {
        donation.transactionId = transactionId;
      }

      // 🔐 IDÉMPOTENCE : on ne crédite qu'une seule fois !
      const project = await Project.findById(donation.projet);
      if (project) {
        project.soldeActuel += donation.montant;
        await project.save();
      }

    } else if (status === 'error') {
      donation.statut = 'echoue';

      if (transactionId) {
        donation.transactionId = transactionId;
      }
    }

    await donation.save();

    return res.json({
      success: true,
      donation,
      message: status === 'success'
        ? "Don confirmé"
        : "Paiement échoué"
    });

  } catch (error) {
    console.error("Erreur callback:", error);
    return res.status(500).json({ error: error.message });
  }
});


// GET tous les dons
router.get('/', async (req, res) => {
  try {
    const { projetId, statut } = req.query;
    
    const filter = {};
    if (projetId) filter.projet = projetId;
    if (statut) filter.statut = statut;

    const donations = await Donation.find(filter)
      .populate('projet', 'nom description')
      .sort({ dateCreation: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un don
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('projet');

    if (!donation) {
      return res.status(404).json({ error: 'Don non trouvé' });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET stats globales
router.get('/stats/global', async (req, res) => {
  try {
    const totalDons = await Donation.countDocuments({ statut: 'reussi' });
    const montantTotal = await Donation.aggregate([
      { $match: { statut: 'reussi' } },
      { $group: { _id: null, total: { $sum: '$montant' } } }
    ]);

    res.json({
      nombreDons: totalDons,
      montantTotal: montantTotal[0]?.total || 0,
      donMoyen: totalDons > 0 ? (montantTotal[0]?.total || 0) / totalDons : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;