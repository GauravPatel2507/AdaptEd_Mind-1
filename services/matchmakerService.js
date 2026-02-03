// Study Matchmaker Service - Module 9
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  query, 
  where,
  orderBy,
  addDoc
} from 'firebase/firestore';

// Find study partners based on subjects and availability
export const findStudyPartners = async (userId, preferences = {}) => {
  const {
    subjects = [],
    studyLevel = 'any',
    availableTimes = [],
    maxResults = 10
  } = preferences;

  try {
    // Get current user's profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    const currentUser = userDoc.data();

    // Query for potential matches
    let matchQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );
    
    const snapshot = await getDocs(matchQuery);
    
    const potentialMatches = [];
    snapshot.forEach((doc) => {
      if (doc.id !== userId) {
        const userData = doc.data();
        const matchScore = calculateMatchScore(currentUser, userData, subjects);
        if (matchScore > 0) {
          potentialMatches.push({
            id: doc.id,
            ...userData,
            matchScore,
            commonSubjects: getCommonSubjects(currentUser, userData, subjects)
          });
        }
      }
    });
    
    // Sort by match score and limit results
    const topMatches = potentialMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults);
    
    return { success: true, data: topMatches };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send study partner request
export const sendPartnerRequest = async (fromUserId, toUserId, message = '') => {
  try {
    const requestData = {
      fromUserId,
      toUserId,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const requestRef = await addDoc(collection(db, 'partnerRequests'), requestData);
    
    return { success: true, data: { requestId: requestRef.id } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Accept or reject partner request
export const respondToRequest = async (requestId, accepted) => {
  try {
    const requestRef = doc(db, 'partnerRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      return { success: false, error: 'Request not found' };
    }
    
    const status = accepted ? 'accepted' : 'rejected';
    await updateDoc(requestRef, { 
      status,
      respondedAt: new Date().toISOString()
    });
    
    // If accepted, create study buddy relationship
    if (accepted) {
      const { fromUserId, toUserId } = requestDoc.data();
      await createStudyBuddyRelationship(fromUserId, toUserId);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user's study buddies
export const getStudyBuddies = async (userId) => {
  try {
    const buddiesQuery = query(
      collection(db, 'studyBuddies'),
      where('users', 'array-contains', userId)
    );
    const snapshot = await getDocs(buddiesQuery);
    
    const buddyIds = new Set();
    snapshot.forEach((doc) => {
      const data = doc.data();
      data.users.forEach(id => {
        if (id !== userId) buddyIds.add(id);
      });
    });
    
    // Get buddy profiles
    const buddies = [];
    for (const buddyId of buddyIds) {
      const buddyDoc = await getDoc(doc(db, 'users', buddyId));
      if (buddyDoc.exists()) {
        buddies.push({
          id: buddyId,
          ...buddyDoc.data()
        });
      }
    }
    
    return { success: true, data: buddies };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper: Calculate match score
const calculateMatchScore = (user1, user2, targetSubjects) => {
  let score = 0;
  
  // Subject match (most important)
  const subjects1 = user1.subjects || [];
  const subjects2 = user2.subjects || [];
  
  const commonSubjects = subjects1.filter(s => subjects2.includes(s));
  score += commonSubjects.length * 20;
  
  // If targeting specific subjects
  if (targetSubjects.length > 0) {
    const targetMatch = targetSubjects.filter(s => subjects2.includes(s));
    score += targetMatch.length * 30;
  }
  
  // Similar performance level
  const level1 = user1.stats?.averageScore || 50;
  const level2 = user2.stats?.averageScore || 50;
  const levelDiff = Math.abs(level1 - level2);
  if (levelDiff < 10) score += 15;
  else if (levelDiff < 20) score += 10;
  else if (levelDiff < 30) score += 5;
  
  // Activity level (both should be active learners)
  const streak1 = user1.stats?.streak || 0;
  const streak2 = user2.stats?.streak || 0;
  if (streak1 > 3 && streak2 > 3) score += 10;
  
  return score;
};

// Helper: Get common subjects
const getCommonSubjects = (user1, user2, targetSubjects) => {
  const subjects1 = user1.subjects || [];
  const subjects2 = user2.subjects || [];
  
  let relevant = subjects1.filter(s => subjects2.includes(s));
  
  if (targetSubjects.length > 0) {
    relevant = relevant.filter(s => targetSubjects.includes(s));
  }
  
  return relevant;
};

// Helper: Create study buddy relationship
const createStudyBuddyRelationship = async (userId1, userId2) => {
  const relationshipData = {
    users: [userId1, userId2].sort(),
    createdAt: new Date().toISOString(),
    lastInteraction: new Date().toISOString()
  };
  
  await addDoc(collection(db, 'studyBuddies'), relationshipData);
};

export default {
  findStudyPartners,
  sendPartnerRequest,
  respondToRequest,
  getStudyBuddies
};
