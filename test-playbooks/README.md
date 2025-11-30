# Test Playbooks for State Visualization

These playbooks are designed to test and demonstrate all the execution states in the A-Station canvas visualization.

## Available Playbooks

### 1. `simple-demo.yml` ⭐ **START HERE**
**Best for:** Quick testing of common states

**What it demonstrates:**
- ✅ **Success** (5 tasks) - Green checkmarks
- ❌ **Failed** (1 task) - Red X
- ⊘ **Skipped** (2 tasks) - Yellow skip icons

**States shown:** `success`, `failed`, `skipped`

**Runtime:** ~5 seconds

---

### 2. `state-demo.yml`
**Best for:** Comprehensive state testing

**What it demonstrates:**
- ✅ **Success** (7 tasks) - Various successful operations
- ❌ **Failed** (2 tasks) - Intentional failures with `ignore_errors`
- ⊘ **Skipped** (2 tasks) - Conditional tasks that don't run

**States shown:** `success`, `failed`, `skipped`

**Runtime:** ~10 seconds

**Features:**
- Creates temporary files
- Sets and displays variables
- Shows system information
- Demonstrates error recovery with `ignore_errors: yes`

---

### 3. `unreachable-demo.yml`
**Best for:** Testing the unreachable state (advanced)

**What it demonstrates:**
- 🔌 **Unreachable** - Attempts to connect to non-existent host (192.0.2.1)
- ✅ **Success** - Tasks on localhost before/after

**States shown:** `success`, `unreachable` (treated as `failed`)

**Runtime:** ~10 seconds (includes connection timeout)

**Note:** This playbook uses a TEST-NET IP address (192.0.2.1) which is reserved for documentation and should not be routable. The SSH connection will timeout quickly.

---

## Expected Visual Results

When you run these playbooks in A-Station, you should see:

### Task State Colors & Icons:

| State | Color | Icon | Border & Background |
|-------|-------|------|---------------------|
| **Running** | 🔵 Blue | ⟳ (spinning) | `border-blue-500 bg-blue-50` + pulse animation |
| **Success** | 🟢 Green | ✓ | `border-green-500 bg-green-50` |
| **Failed** | 🔴 Red | ✗ | `border-red-500 bg-red-50` |
| **Skipped** | 🟡 Yellow | ⊘ | `border-yellow-500 bg-yellow-50` |
| **Idle** | ⚪ Gray | (none) | `border-border bg-background` |

---

## How to Use

1. **Upload a test playbook** to A-Station
2. **Execute** the playbook
3. **Watch the canvas** as tasks transition through states:
   - Tasks start as **Idle** (gray)
   - When executed, they become **Running** (blue, pulsing)
   - Then transition to **Success** (green) / **Failed** (red) / **Skipped** (yellow)

---

## Understanding the States

### ✅ Success (`runner_on_ok`)
Tasks that complete without errors. Examples:
- `debug` messages
- `set_fact` operations
- `file` creation when successful
- Most tasks when they work correctly

### ❌ Failed (`runner_on_failed`)
Tasks that encounter errors. Examples:
- `fail` module (intentional)
- Commands that don't exist
- Permission errors
- Invalid parameters

**Note:** Use `ignore_errors: yes` to continue execution after failures

### ⊘ Skipped (`runner_on_skipped`)
Tasks with conditions that evaluate to `false`. Examples:
- `when: false`
- `when: 1 == 2`
- `when: variable_that_is_false | bool`

### 🔌 Unreachable (`runner_on_unreachable`)
Host cannot be reached (network/SSH issues). Examples:
- Non-existent IP addresses
- Hosts that are down
- Network connectivity issues
- SSH timeout

---

## Tips for Testing

1. **Start with `simple-demo.yml`** - It's the quickest way to see all common states

2. **Use the MiniMap** - The MiniMap (bottom-left of canvas) shows color-coded nodes:
   - Blue = running
   - Green = success
   - Red = failed
   - Yellow = skipped

3. **Check the execution flow** - Watch tasks turn blue as they execute in sequence

4. **Verify state persistence** - States should persist after playbook completion

5. **Test WebSocket connection** - Open browser console to see Ansible events:
   ```
   Ansible event: runner_on_start
   Ansible event: runner_on_ok
   Ansible event: runner_on_failed
   Ansible event: runner_on_skipped
   ```

---

## Troubleshooting

### Tasks not updating?
- Check WebSocket connection in browser console
- Verify task names match between YAML and canvas
- Check that `useJobExecution` hook is subscribed

### All tasks showing same state?
- Verify event handler is calling `updateTaskStateByName`
- Check task_name is present in WebSocket events
- Ensure state mappings are correct in `useJobExecution.ts`

### Unreachable state not showing?
- Verify `runner_on_unreachable` is handled in event switch
- Check SSH timeout is set (should be quick)
- Confirm host is actually unreachable (192.0.2.1 is TEST-NET)

---

## Event Mapping Reference

```typescript
// From useJobExecution.ts
"runner_on_start"       → "running"
"runner_on_ok"          → "success"
"runner_on_failed"      → "failed"
"runner_on_skipped"     → "skipped"
"runner_on_unreachable" → "failed"
```
