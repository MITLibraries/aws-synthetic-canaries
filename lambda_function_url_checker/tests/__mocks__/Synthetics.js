module.exports = {
  executeStep: jest.fn(async (_name, fn) => {
    await fn();
  })
};
