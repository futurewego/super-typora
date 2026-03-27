describe("storage environment", () => {
  it("provides indexeddb in test runtime", () => {
    expect(indexedDB).toBeDefined();
  });
});
