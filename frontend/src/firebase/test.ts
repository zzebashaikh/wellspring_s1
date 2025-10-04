// firebase/test.ts
import { recordReceptionistLogin, getRecentLogins } from "./firestore";

/**
 * Test function to verify Firestore login tracking is working
 * Call this from browser console to test: testFirestoreLogin()
 */
export async function testFirestoreLogin() {
  try {
    console.log("Testing Firestore login recording...");
    
    // Test recording a login
    const testLoginId = await recordReceptionistLogin(
      "test-uid-123",
      "test@hospital.com",
      "Test Receptionist"
    );
    
    console.log("Test login recorded with ID:", testLoginId);
    
    // Test fetching recent logins
    const recentLogins = await getRecentLogins(5);
    console.log("Recent logins:", recentLogins);
    
    return {
      success: true,
      testLoginId,
      recentLogins
    };
  } catch (error) {
    console.error("Test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testFirestoreLogin = testFirestoreLogin;
}
