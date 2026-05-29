import { deepSerialize } from "./deep-serialize";

export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(deepSerialize(data)));
}
