import { systemic } from '../src';
import { mockComponent } from './mocks/component-mock';

describe('systemic', () => {
  it('starts without any components', async () => {
    const system = systemic();

    const components = await system.start();

    expect(components).toEqual({});
  });

  it('stops without any components', async () => {
    const system = systemic();

    await system.start();
    await system.stop();
  });

  it('stops without being started', async () => {
    const system = systemic();

    await system.stop();
  });

  it('starts a single component', async () => {
    const foo = mockComponent('foo');
    const system = systemic().add('foo', foo);

    const components = await system.start();

    expect(components).toEqual({ foo: 'foo' });
    expect(foo.state).toEqual({ numberOfStarts: 1, isActive: true, dependencies: {} });
    expect(foo.start).toHaveBeenCalledTimes(1);
    expect(foo.stop).not.toHaveBeenCalled();
  });

  it('stops a single component after being started', async () => {
    const foo = mockComponent('foo');
    const system = systemic().add('foo', foo);

    await system.start();
    await system.stop();

    expect(foo.state).toEqual({ numberOfStarts: 1, isActive: false, dependencies: {} });
    expect(foo.start).toHaveBeenCalledTimes(1);
    expect(foo.stop).toHaveBeenCalledTimes(1);
  });

  it('does not stop a single component if it was not started', async () => {
    const foo = mockComponent('foo');
    const system = systemic().add('foo', foo);

    await system.stop();

    expect(foo.state).toEqual({ numberOfStarts: 0, isActive: false, dependencies: undefined });
    expect(foo.start).not.toHaveBeenCalled();
    expect(foo.stop).not.toHaveBeenCalled();
  });

  it('restarts a single component', async () => {
    const foo = mockComponent('foo');
    const system = systemic().add('foo', foo);

    await system.start();

    expect(foo.state).toEqual({ numberOfStarts: 1, isActive: true, dependencies: {} });
    expect(foo.start).toHaveBeenCalledTimes(1);
    expect(foo.stop).not.toHaveBeenCalled();

    await system.restart();

    expect(foo.state).toEqual({ numberOfStarts: 2, isActive: true, dependencies: {} });
    expect(foo.start).toHaveBeenCalledTimes(2);
    expect(foo.stop).toHaveBeenCalledTimes(1);
  });
});
