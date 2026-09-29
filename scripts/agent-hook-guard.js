/**
 * Antigravity Agent Lifecycle Hook: Stop Guard
 * Ensures that the agent cannot terminate without 100% passing verify-blueprint.js
 */
const { execSync } = require('child_process');
const path = require('path');

function runHook() {
  try {
    // Run verify-blueprint synchronously
    const verifyScript = path.join(__dirname, 'verify-blueprint.js');
    execSync(`node "${verifyScript}"`, { stdio: 'pipe' });
    
    // If passed, allow stopping
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    // If failed, block stopping and force agent to fix the issue!
    const errorMsg = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    process.stdout.write(JSON.stringify({
      decision: 'continue',
      reason: `[물리적 검문소 차단] 8대 공식 설계도 검문소를 통과하지 못했습니다! 땜빵, 문법오류, 찌꺼기를 완전히 해결한 후 종료해야 합니다:\n${errorMsg.slice(0, 500)}`
    }));
  }
}

runHook();
