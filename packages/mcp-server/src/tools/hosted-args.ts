import { z } from 'zod';

export type RegisterToolOptions = {
  /** Resolved from NEURON_API_KEY — makes project_id optional on tool inputs */
  defaultProjectId?: string;
};

export function isHostedRegistration(options?: RegisterToolOptions): boolean {
  return !!options?.defaultProjectId;
}

export function projectIdZod(hosted: boolean) {
  return hosted ? z.string().uuid().optional() : z.string().uuid();
}

export function withOptionalProjectId<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  hosted: boolean,
): z.ZodObject<z.ZodRawShape> {
  if (!hosted) return schema;
  return schema.extend({ project_id: z.string().uuid().optional() });
}

export function parseProjectArgs<T extends { project_id?: string }>(
  schema: z.ZodType<T>,
  args: unknown,
  defaultProjectId?: string,
): T & { project_id: string } {
  const parsed = schema.parse(args) as T;
  const project_id = parsed.project_id ?? defaultProjectId;
  if (!project_id) {
    throw new Error('project_id is required');
  }
  return { ...parsed, project_id };
}

export function toolShape<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  hosted: boolean,
): T['shape'] {
  return withOptionalProjectId(schema, hosted).shape as T['shape'];
}
