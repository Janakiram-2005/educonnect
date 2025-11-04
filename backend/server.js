require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- Middleware ---
app.use(cors()); // Allow your frontend to talk to this backend
app.use(express.json()); // Allow server to read JSON bodies

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Database Schemas (The "Models") ---

// 1. Faculty Schema
const facultySchema = new mongoose.Schema({
  // We use _id from MongoDB, but we need to match the 'id' from Supabase Auth
  id: { type: String, required: true, unique: true }, 
  name: { type: String, required: true },
  subject: { type: String, required: true },
  rate: { type: Number, required: true },
  rating: { type: Number, default: 5 },
  available: { type: Boolean, default: true }
});

const Faculty = mongoose.model('Faculty', facultySchema);

// 2. Subject Schema
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String }
});

const Subject = mongoose.model('Subject', subjectSchema);

// --- API Routes (The "Endpoints") ---

// Test route
app.get('/', (req, res) => {
  res.send('EduConnect Backend is running!');
});

// GET all faculty
app.get('/api/faculty', async (req, res) => {
  try {
    const facultyList = await Faculty.find();
    res.json(facultyList);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching faculty', error: err });
  }
});

// GET a single faculty profile by their Supabase ID
app.get('/api/faculty/:id', async (req, res) => {
  try {
    // Find faculty by their Supabase Auth ID, which we store as 'id'
    const facultyProfile = await Faculty.findOne({ id: req.params.id });
    if (!facultyProfile) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }
    res.json(facultyProfile);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching faculty profile', error: err });
  }
});

// --- THIS IS THE NEW ROUTE TO CREATE A FACULTY ---
app.post('/api/faculty', async (req, res) => {
  try {
    const { id, name, subject, rate, available, rating } = req.body;

    // Check if faculty already exists (just in case)
    const existingFaculty = await Faculty.findOne({ id: id });
    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty with this ID already exists.' });
    }

    const newFaculty = new Faculty({
      id,
      name,
      subject,
      rate,
      available,
      rating
    });

    await newFaculty.save();
    res.status(201).json(newFaculty); // 201 = Created
  } catch (err) {
    res.status(500).json({ message: 'Error creating faculty profile', error: err });
  }
});
// --- END OF NEW ROUTE ---

// GET all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const subjectList = await Subject.find();
    res.json(subjectList);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects', error: err });
  }
});

// --- Start the Server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

