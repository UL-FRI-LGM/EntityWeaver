import { z } from "zod";

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});

export const EntitySchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});

export const LinkSchema = z.object({
  entity_id: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const MentionSchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  type: z.string().min(1),
  document_id: z.string().min(1),
  start_index: z.int(),
  end_index: z.int(),
  links: z.array(LinkSchema),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});

export const DocumentSchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});

export const CollocationSchema = z.object({
  id: z.string().min(1),
  document_id: z.string().min(1),
  mentions: z.array(z.string().min(1)),
});

export const AttributeValueSchema = z.union([
  z.string(),
  z.object({
    name: z.string().min(1),
    text: z.optional(z.string()),
  }),
]);

export const RecordTypeSchema = z.enum(["Document", "Mention", "Entity"]);
export const AttributeDataTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "enum",
]);

export const AttributeSchema = z
  .object({
    name: z.string(),
    type: AttributeDataTypeSchema,
    records: z.array(RecordTypeSchema).min(1),
    values: z.optional(z.array(AttributeValueSchema)),
  })
  .refine(
    (attribute) =>
      attribute.type !== "enum" ||
      (attribute.values !== undefined && attribute.values.length > 0),
    {
      message: "Enum attributes must have values defined",
    },
  );

export const DatasetSchema = z.object({
  attributes: z.array(AttributeSchema),
  documents: z.array(DocumentSchema),
  entities: z.array(EntitySchema),
  mentions: z.array(MentionSchema),
  collocations: z.array(CollocationSchema),
});
