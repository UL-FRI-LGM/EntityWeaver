import { z } from "zod";
import { RESERVED_ATTRIBUTES } from "@/defines.ts";

const AttributeTypeSchema = z.union([z.number(), z.string(), z.boolean()]);
export type AttributeType = z.infer<typeof AttributeTypeSchema>;

const NodeAttributesSchema = z.record(z.string(), AttributeTypeSchema);
export type NodeAttributes = z.infer<typeof NodeAttributesSchema>;

const GraphNodeSchema = z.object({
  id: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
  attributes: z.optional(NodeAttributesSchema),
});

const EntitySchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
  name: z.string().min(1),
});
export type EntityDB = z.output<typeof EntitySchema>;

export const LinkSchema = z.object({
  entity_id: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const MentionSchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  document_id: z.string().min(1),
  start_index: z.int(),
  end_index: z.int(),
  links: z.array(LinkSchema),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});
export type MentionDB = z.output<typeof MentionSchema>;

const DocumentSchema = GraphNodeSchema.extend({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});
export type DocumentDB = z.output<typeof DocumentSchema>;

const CollocationSchema = z.object({
  id: z.string().min(1),
  document_id: z.string().min(1),
  mentions: z.array(z.string().min(1)),
});
export type CollocationDB = z.output<typeof CollocationSchema>;

const AttributeValueSchema = z.union([
  z.string(),
  z.object({
    name: z.string().min(1),
    label: z.optional(z.string()),
    color: z.optional(z.string()),
    glyph: z.optional(z.string()),
  }),
]);
export type AttributeValueDB = z.output<typeof AttributeValueSchema>;

export const RecordTypes = ["Document", "Mention", "Entity"] as const;
const RecordTypeSchema = z.enum(RecordTypes);
export type GraphNodeType = z.infer<typeof RecordTypeSchema>;

const AttributeDataTypeSchema = z.enum(["text", "number", "boolean", "enum"]);
export type AttributeDataType = z.infer<typeof AttributeDataTypeSchema>;

const BaseAttributeSchema = z
  .object({
    name: z.string().min(1),
    label: z.optional(z.string()),
    type: AttributeDataTypeSchema,
    activeColor: z.boolean().optional().default(false),
    activeGlyph: z.boolean().optional().default(false),
    records: z.array(RecordTypeSchema).min(1),
  })
  .refine(
    (attribute) => {
      for (const reservedAttribute of RESERVED_ATTRIBUTES) {
        if (
          attribute.records.some((item) =>
            reservedAttribute.records.includes(item),
          ) &&
          reservedAttribute.name === attribute.name
        ) {
          return false;
        }
      }
      return true;
    },
    {
      error: `Attributes contain a reserved attribute name`,
      abort: true,
    },
  );

const AttributeSchema = z.discriminatedUnion("type", [
  BaseAttributeSchema.safeExtend({
    type: z.literal("text"),
  }),
  BaseAttributeSchema.safeExtend({
    type: z.literal("number"),
    min: z.number(),
    max: z.number(),
  }),
  BaseAttributeSchema.safeExtend({
    type: z.literal("boolean"),
  }),
  BaseAttributeSchema.safeExtend({
    type: z.literal("enum"),
    values: z.optional(z.array(AttributeValueSchema)),
  }),
]);

export type AttributeDB = z.output<typeof AttributeSchema>;

export const DatasetSchema = z.object({
  attributes: z.array(AttributeSchema),
  documents: z.array(DocumentSchema),
  entities: z.array(EntitySchema),
  mentions: z.array(MentionSchema),
  collocations: z.array(CollocationSchema),
});
export type DatasetDB = z.output<typeof DatasetSchema>;
