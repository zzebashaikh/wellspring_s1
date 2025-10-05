# Hotfix Rollback Plan

## Files Modified in This Hotfix

### Frontend Changes
1. **`frontend/src/components/dashboard/PatientQueue.tsx`**
   - Added `allocationPending` state to track allocation status
   - Fixed Select component to be consistently controlled (`value={selectedResource[patient.id] || ""}`)
   - Added async error handling for allocation button
   - Added "Allocating..." loading state

2. **`frontend/src/pages/Dashboard.tsx`**
   - Enhanced `allocateResource` function with proper error handling and logging
   - Enhanced `dispatchAmbulance` function with better error handling and logging
   - Made `allocateResource` function properly async and throw errors

3. **`frontend/src/components/dashboard/AmbulanceHistory.tsx`**
   - Added fallback API call when real-time returns empty
   - Added periodic refresh (30s) as safety net
   - Enhanced logging for dispatch visibility debugging

### Test Files Added
4. **`frontend/src/components/dashboard/__tests__/PatientQueue.test.tsx`**
5. **`frontend/src/components/dashboard/__tests__/AmbulanceDispatch.test.tsx`**
6. **`frontend/src/pages/__tests__/Dashboard.test.tsx`**

## Rollback Steps (If Needed)

### Quick Rollback (Restore Previous Behavior)
```bash
# 1. Revert PatientQueue.tsx
git checkout HEAD~1 -- frontend/src/components/dashboard/PatientQueue.tsx

# 2. Revert Dashboard.tsx
git checkout HEAD~1 -- frontend/src/pages/Dashboard.tsx

# 3. Revert AmbulanceHistory.tsx
git checkout HEAD~1 -- frontend/src/components/dashboard/AmbulanceHistory.tsx

# 4. Remove test files (optional)
rm -rf frontend/src/components/dashboard/__tests__/
rm -rf frontend/src/pages/__tests__/

# 5. Commit rollback
git add .
git commit -m "ROLLBACK: Revert ambulance dispatch hotfix"
```

### Selective Rollback (Keep Some Fixes)
If only certain fixes need to be rolled back:

```bash
# Rollback only Select component fix
git checkout HEAD~1 -- frontend/src/components/dashboard/PatientQueue.tsx
# Then manually restore only the error handling parts you want to keep

# Rollback only allocation error handling
# Manually revert the allocateResource function changes in Dashboard.tsx
```

## Risk Assessment

### Low Risk Changes
- ✅ **Select Component Fix**: Pure UI fix, no API changes
- ✅ **Error Handling**: Only adds try/catch blocks, doesn't change core logic
- ✅ **Logging**: Only adds console.log statements, no functional changes

### Medium Risk Changes
- ⚠️ **Allocation Flow**: Made allocation async, could affect timing
- ⚠️ **Real-time Fallbacks**: Added periodic refresh, could increase API calls

### No Backend Changes
- ✅ All fixes are frontend-only
- ✅ No API contract changes
- ✅ No database schema changes

## Verification After Rollback

1. **Check Console**: Ensure no uncontrolled→controlled Select warnings
2. **Test Allocation**: Verify allocation still works (may have less error handling)
3. **Test Dispatch**: Verify dispatch creation still works
4. **Check Network**: Monitor for any increased API calls

## Emergency Contacts
- **Primary**: Development Team
- **Backup**: DevOps Team
- **Escalation**: Technical Lead

## Rollback Decision Criteria

**Rollback if:**
- Users report increased crashes (more than before hotfix)
- Performance significantly degraded
- New critical bugs introduced

**Do NOT rollback if:**
- Only minor UI issues
- Non-critical console warnings
- Expected temporary increase in API calls

## Post-Rollback Actions

1. **Monitor**: Watch error rates for 24 hours
2. **Analyze**: Review logs to understand why rollback was needed
3. **Plan**: Create improved hotfix with lessons learned
4. **Document**: Update this rollback plan with new insights
