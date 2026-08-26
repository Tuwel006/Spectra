/**
 * Backward-compatibility re-export.
 *
 * The implementation now lives in `decorator-arg.ts` (E7 generalized
 * the original guard extractor into a generic decorator-argument
 * extractor). This file keeps the old import surface working.
 */
export {
    GuardSourceExtractor,
} from "./decorator-arg";

export type {
    DecoratorArgView,
    GuardSourceView,
} from "./decorator-arg";
