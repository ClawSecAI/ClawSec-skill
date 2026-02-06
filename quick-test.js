#!/usr/bin/env node
// Quick syntax check and basic functionality test

try {
  console.log('Loading score calculator...');
  const calc = require('./server/lib/score-calculator');
  console.log('✅ Module loaded successfully');
  
  console.log('\nTesting basic calculation...');
  const result = calc.calculateRiskScore([]);
  console.log(`✅ Empty findings: score=${result.score}, level=${result.level}`);
  
  const result2 = calc.calculateRiskScore([{
    severity: 'CRITICAL',
    title: 'Test',
    likelihood: 'HIGH'
  }]);
  console.log(`✅ One critical: score=${result2.score}, level=${result2.level}`);
  
  console.log('\n🎉 Score calculator is working!\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
