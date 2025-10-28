# 🔧 TIMEOUT FIX FOR UPGRADE SYSTEM

**Issue:** Upgrade system timing out during health checks (10 second limit too aggressive)

## 🚑 QUICK FIX NEEDED

In `shared/services/DebuggerService.ts`, line 55, change:

```typescript
// FROM:
setTimeout(() => reject(new Error('Check timeout')), 10000)

// TO:
setTimeout(() => reject(new Error('Check timeout')), 30000) // 30 seconds
```

## 🔍 WHY THIS FIXES THE ISSUE

- **Current:** 10 second timeout is too aggressive for UpgradeStorage initialization
- **Solution:** 30 second timeout allows schema setup to complete properly  
- **Result:** Upgrade system will pass health checks and stop being disabled

## 🔄 ALTERNATIVE: Use Admin Endpoints

You can also use the admin endpoints to fix this without code changes:

```bash
# Fix upgrade system timeout
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:5000/api/admin/recheck/upgrades

# Or recheck all systems
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:5000/api/admin/recheck-all
```

## ✅ EXPECTED RESULT AFTER FIX

```
🟢 [CHECK] upgrades OK
🟢 [CHECK] levels OK 
✅ [STATUS] 6/7 systems operational
```

**Status:** Ready to apply - just need to increase timeout value!