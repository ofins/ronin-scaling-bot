export function autoBindMethods(
  instance: any,
  exclude: string[] = ["constructor"]
) {
  const proto = Object.getPrototypeOf(instance);

  Object.getOwnPropertyNames(proto).forEach((method) => {
    if (!exclude.includes(method) && typeof instance[method] === "function") {
      instance[method] = instance[method].bind(instance);
    }
  });
}
