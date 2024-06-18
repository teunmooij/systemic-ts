import { randomName } from '../../src/util/random-name';

describe('randomName', () => {
  it('returns a random name', () => {
    const name = randomName();
    expect(name).toMatch(/^Z-\d+$/);
  });
});
