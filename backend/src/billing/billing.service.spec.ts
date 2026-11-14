import { BILLING_PLANS } from './billing.service';

describe('billing catalogue',()=>{
 it('contains a free baseline and progressively larger paid plans',()=>{
  expect(BILLING_PLANS.map(p=>p.code)).toEqual(['FREE','STARTER','BUSINESS','SCALE']);
  expect(BILLING_PLANS[0].monthly).toBe(0);
  expect(BILLING_PLANS[1].limits.members).toBeGreaterThan(BILLING_PLANS[0].limits.members);
  expect(BILLING_PLANS[2].features).toContain('ai');
  expect(BILLING_PLANS[3].limits.storageBytes).toBeGreaterThan(BILLING_PLANS[2].limits.storageBytes);
 });
 it('keeps monthly and yearly catalogue amounts as integer cents',()=>{
  for(const plan of BILLING_PLANS){expect(Number.isInteger(plan.monthly)).toBe(true);expect(Number.isInteger(plan.yearly)).toBe(true);expect(plan.monthly).toBeGreaterThanOrEqual(0);expect(plan.yearly).toBeGreaterThanOrEqual(0);}
 });
});
