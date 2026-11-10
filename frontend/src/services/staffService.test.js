import test from 'node:test';
import assert from 'node:assert/strict';
import { staffService } from './staffService.js';
import { apiClient } from './apiClient.js';

test('staffService.deleteStaff repassa staffId para deleteRecord', async () => {
  let calledEntity = null;
  let calledId = null;

  const originalDeleteRecord = apiClient.deleteRecord;
  apiClient.deleteRecord = async (entity, id) => {
    calledEntity = entity;
    calledId = id;
    return { success: true };
  };

  try {
    const result = await staffService.deleteStaff('colaborador-123');
    assert.equal(calledEntity, 'staff');
    assert.equal(calledId, 'colaborador-123');
    assert.deepEqual(result, { success: true });
  } finally {
    apiClient.deleteRecord = originalDeleteRecord;
  }
});
