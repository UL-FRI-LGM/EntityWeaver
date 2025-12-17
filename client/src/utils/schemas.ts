import { z } from "zod";

export const AttributeValues = z.union([z.number(), z.string(), z.boolean()]);
export type AttributeValuesType = z.infer<typeof AttributeValues>;

export const NodeAttributes = z.record(z.string(), AttributeValues);

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
  attributes: z.optional(NodeAttributes),
});

const RequiredEntitySchemaKeys = ["name"] as const;

export const EntitySchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
  attributes: z
    .optional(NodeAttributes)
    .refine(
      (record) => !record || RequiredEntitySchemaKeys.every((k) => k in record),
      {
        message:
          "Entity must have required attributes: " +
          RequiredEntitySchemaKeys.join(", "),
      },
    ),
});

export const LinkSchema = z.object({
  entity_id: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const MentionSchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  document_id: z.string().min(1),
  start_index: z.int(),
  end_index: z.int(),
  links: z.array(LinkSchema),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});

const RequiredDocumentSchemaKeys = ["title"] as const;

export const DocumentSchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  // title: z.string().min(1),
  text: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
  attributes: z
    .optional(NodeAttributes)
    .refine(
      (record) =>
        !record || RequiredDocumentSchemaKeys.every((k) => k in record),
      {
        message:
          "Document must have required attributes: " +
          RequiredEntitySchemaKeys.join(", "),
      },
    ),
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
    label: z.optional(z.string()),
    color: z.optional(z.string()),
  }),
]);

export const RecordTypes = ["Document", "Mention", "Entity"] as const;
export const RecordTypeSchema = z.enum(RecordTypes);
export const AttributeDataTypeSchema = z.enum([
  "text",
  "number",
  "boolean",
  "enum",
]);

export const AttributeSchema = z
  .object({
    name: z.string(),
    label: z.optional(z.string()),
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
