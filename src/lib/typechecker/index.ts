/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
export function is<T, D>(opts: { name: string, variable: T, type: 'string'|'number'|'boolean'|'object'}): T
export function is<T, D>(opts: { name: string, variable: T, type: D}): D
export function is<T, D>(opts: { name: string, variable: T, type: 'string'|'number'|'boolean'|'object'| D }): T | D {
  const { name, variable, type } = opts;
  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'object') {
    // eslint-disable-next-line valid-typeof
    if (type === typeof variable) return variable;
    const err = new TypeError(`unexpected type of '${name}': a ${type} was expected but got '${typeof variable}'`);
    err.name += ' [ERR_INVALID_ARG_TYPE]';
    throw err;
  }
  if (typeof type === typeof variable) return variable;
  return type;
}
