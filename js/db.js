// IndexedDB wrapper for FitTrack Pro

const DB_NAME = 'FitTrackDB';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Workouts store
      if (!database.objectStoreNames.contains('workouts')) {
        const workoutStore = database.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('date', 'date', { unique: false });
        workoutStore.createIndex('type', 'type', { unique: false });
      }

      // Goals store
      if (!database.objectStoreNames.contains('goals')) {
        const goalStore = database.createObjectStore('goals', { keyPath: 'id' });
        goalStore.createIndex('type', 'type', { unique: false });
      }

      // Weight entries store
      if (!database.objectStoreNames.contains('weights')) {
        const weightStore = database.createObjectStore('weights', { keyPath: 'id' });
        weightStore.createIndex('date', 'date', { unique: false });
      }

      // Steps store
      if (!database.objectStoreNames.contains('steps')) {
        const stepsStore = database.createObjectStore('steps', { keyPath: 'date' });
        stepsStore.createIndex('date', 'date', { unique: false });
      }
    };
  });
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Workouts
async function addWorkout(workout) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    const entry = {
      ...workout,
      id: workout.id || generateId(),
      createdAt: new Date().toISOString()
    };
    const request = store.add(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(request.error);
  });
}

async function updateWorkout(workout) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    const request = store.put(workout);
    request.onsuccess = () => resolve(workout);
    request.onerror = () => reject(request.error);
  });
}

async function deleteWorkout(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    const request = store.delete(id);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function getWorkouts() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['workouts'], 'readonly');
    const store = transaction.objectStore('workouts');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
    request.onerror = () => reject(request.error);
  });
}

async function getWorkoutsByType(type) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['workouts'], 'readonly');
    const store = transaction.objectStore('workouts');
    const index = store.index('type');
    const request = index.getAll(type);
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
    request.onerror = () => reject(request.error);
  });
}

// Goals
async function addGoal(goal) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['goals'], 'readwrite');
    const store = transaction.objectStore('goals');
    const entry = {
      ...goal,
      id: goal.id || generateId(),
      createdAt: new Date().toISOString(),
      completed: false
    };
    const request = store.add(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(request.error);
  });
}

async function updateGoal(goal) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['goals'], 'readwrite');
    const store = transaction.objectStore('goals');
    const request = store.put(goal);
    request.onsuccess = () => resolve(goal);
    request.onerror = () => reject(request.error);
  });
}

async function deleteGoal(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['goals'], 'readwrite');
    const store = transaction.objectStore('goals');
    const request = store.delete(id);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function getGoals() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['goals'], 'readonly');
    const store = transaction.objectStore('goals');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getActiveGoals() {
  const goals = await getGoals();
  return goals.filter(g => !g.completed);
}

// Weight entries
async function addWeightEntry(entry) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['weights'], 'readwrite');
    const store = transaction.objectStore('weights');
    const data = {
      ...entry,
      id: entry.id || generateId()
    };
    const request = store.put(data);
    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(request.error);
  });
}

async function getWeightEntries() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['weights'], 'readonly');
    const store = transaction.objectStore('weights');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
    request.onerror = () => reject(request.error);
  });
}

// Steps
async function addStepsEntry(entry) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['steps'], 'readwrite');
    const store = transaction.objectStore('steps');
    const request = store.put(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(request.error);
  });
}

async function getStepsByDate(date) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['steps'], 'readonly');
    const store = transaction.objectStore('steps');
    const request = store.get(date);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStepsRange(startDate, endDate) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['steps'], 'readonly');
    const store = transaction.objectStore('steps');
    const index = store.index('date');
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Utility functions
function estimateCalories(type, duration, distance, weight) {
  const MET = {
    running: 9.8,
    cycling: 7.5,
    swimming: 8.0,
    weightlifting: 6.0,
    yoga: 3.0,
    custom: 5.0
  };
  const met = MET[type] || 5.0;
  const userWeight = weight || 70;
  return Math.round(met * userWeight * (duration / 60));
}

export {
  openDB,
  addWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkouts,
  getWorkoutsByType,
  addGoal,
  updateGoal,
  deleteGoal,
  getGoals,
  getActiveGoals,
  addWeightEntry,
  getWeightEntries,
  addStepsEntry,
  getStepsByDate,
  getStepsRange,
  estimateCalories
};
