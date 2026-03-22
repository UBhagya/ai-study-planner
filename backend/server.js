const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route - check this works first
app.get('/', (req, res) => {
  res.json({ message: 'Backend working 🎉' });
});

// Load auth routes with error checking
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.error('❌ Auth routes failed to load:', err.message);
}

// Load subject routes with error checking
try {
  const subjectRoutes = require('./routes/subjects');
  app.use('/api/subjects', subjectRoutes);
  console.log('✅ Subject routes loaded');
} catch (err) {
  console.error('❌ Subject routes failed to load:', err.message);
}

// Load availability routes with error checking
try {
  const availabilityRoutes = require('./routes/availability');
  app.use('/api/availability', availabilityRoutes);
  console.log('✅ Availability routes loaded');
} catch (err) {
  console.error('❌ Availability routes failed to load:', err.message);
}

// Load timetable routes with error checking
try {
  const timetableRoutes = require('./routes/timetable');
  app.use('/api/timetable', timetableRoutes);
  console.log('✅ Timetable routes loaded');
} catch (err) {
  console.error('❌ Timetable routes failed to load:', err.message);
}

// Load DB
try {
  require('./db');
  console.log('✅ DB module loaded');
} catch (err) {
  console.error('❌ DB failed to load:', err.message);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});