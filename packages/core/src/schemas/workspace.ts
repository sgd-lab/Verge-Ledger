import { z } from 'zod';
import { IsoDateTimeSchema, UlidSchema } from './common.js';

export const WorkspaceSchema = z
  .object({
    id: UlidSchema,
    name: z.string().min(1).max(100),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    isDemo: z.boolean().default(false),
    serverId: z.string().nullable().default(null),
    syncEnabled: z.boolean().default(false),
  })
  .strict();

export type Workspace = z.infer<typeof WorkspaceSchema>;
