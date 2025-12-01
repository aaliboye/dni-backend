const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const multer = require('multer');
const path = require('path');

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Type de fichier non supporté'));
  }
});

// GET tous les projets actifs
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ actif: true }).sort({ dateCreation: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un projet par ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer un projet
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { nom, description, objectifSolde, dateFin } = req.body;

    const images = req.files ? req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      publicId: file.filename
    })) : [];

    const project = new Project({
      nom,
      description,
      objectifSolde: Number(objectifSolde),
      images,
      dateFin: dateFin || null
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT mettre à jour un projet
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { nom, description, objectifSolde, actif, dateFin } = req.body;
    
    const updateData = {
      nom,
      description,
      objectifSolde: Number(objectifSolde),
      actif: actif !== undefined ? actif === 'true' : undefined,
      dateFin: dateFin || null
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        publicId: file.filename
      }));
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE désactiver un projet
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({ message: 'Projet désactivé', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET statistiques d'un projet
router.get('/:id/stats', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const Donation = require('../models/Donation');
    const donations = await Donation.find({ 
      projet: req.params.id,
      statut: 'reussi'
    });

    res.json({
      projet: project.nom,
      objectif: project.objectifSolde,
      collecte: project.soldeActuel,
      pourcentage: project.pourcentage,
      nombreDons: donations.length,
      donMoyen: donations.length > 0 
        ? donations.reduce((sum, d) => sum + d.montant, 0) / donations.length 
        : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;