/**
 * Pins the runtime `.name` of a TypeORM entity class to a fixed string.
 *
 * TypeORM computes `EntityMetadata.targetName` from `target.name` (the
 * class's runtime name), and uses that string as the node key when it
 * topologically sorts entities being saved together
 * (`SubjectTopologicalSorter`, see typeorm's `SubjectExecutor`).
 *
 * Next.js's production build minifies each webpack module in its own
 * scope, so unrelated entity classes can independently be renamed to the
 * same short identifier (e.g. two different classes both becoming
 * `class s {}` in two different modules). Since native `class Foo {}`
 * derives `.name` from the source identifier, this collapses two distinct
 * entities to the same `targetName` string at runtime. The topological
 * sorter then sees a self-referencing edge for that shared name and throws
 * `TypeORMError: Cyclic dependency: "<name>"` — even though there is no
 * real cyclic relation in the schema. This only reproduces in the minified
 * production build; `next dev`/ts-node keep class names untouched.
 *
 * Calling this right after each entity class declaration fixes `.name` to
 * a stable, globally unique value that survives minification, so
 * `targetName` can never collide between entities regardless of how the
 * bundler renames local bindings.
 */
export function preserveEntityName(target: Function, name: string): void {
  Object.defineProperty(target, "name", { value: name, configurable: true });
}
