import { Tag } from "@spectra/core";

import type { ControllerModel } from "../semantic/unified-model";

/**
 * Produces `Documentation.tags` from the controllers in the
 * semantic model.
 *
 * Layering:
 *   - Lives in `provider-nestjs` because the controller-name →
 *     tag convention (`ProductsController` → `Products`) is the
 *     NestJS Swagger default. Other frameworks may have different
 *     conventions.
 *
 * Conversion rules:
 *   - A tag is emitted per unique controller-name prefix.
 *   - The "Controller" suffix is stripped to produce a human-readable
 *     tag name (matching NestJS Swagger's behaviour when no
 *     `@ApiTags()` decorator is supplied).
 *   - When the same tag is produced by multiple controllers, only
 *     one Tag entry is emitted.
 *   - Descriptions are NEVER invented; they stay `undefined` until
 *     a JSDoc / `@ApiTags("name", "description")` parser is added.
 */
export class TagGenerator {
    public generate(
        controllers: readonly ControllerModel[],
    ): readonly Tag[] {
        const seen = new Set<string>();
        const out: Tag[] = [];
        for (const ctrl of controllers) {
            const tagName = this.tagFromControllerName(ctrl.name);
            if (seen.has(tagName)) continue;
            seen.add(tagName);
            out.push({
                id: `tag-${this.slug(tagName)}`,
                name: tagName,
            });
        }
        return out;
    }

    private tagFromControllerName(controllerName: string): string {
        if (controllerName.endsWith("Controller")) {
            return controllerName.slice(0, -"Controller".length);
        }
        return controllerName;
    }

    private slug(name: string): string {
        return name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
    }
}