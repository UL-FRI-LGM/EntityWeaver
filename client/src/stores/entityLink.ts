import { Entity } from "@/stores/entity.ts";
import { makeAutoObservable } from "mobx";
import { Mention } from "@/stores/mention.ts";

export class EntityLink {
  entity: Entity;
  mention: Mention;
  confidence: number;

  constructor(
    entity: Entity,
    mention: Mention,
    confidence: number,
    updateGraph = true,
  ) {
    this.entity = entity;
    this.mention = mention;
    this.confidence = confidence;

    mention.onEntityLinked(this, updateGraph);
    entity.onMentionLinked(this);

    makeAutoObservable(this);
  }

  delete(updateGraph = true) {
    this.mention.onEntityUnlinked(this.entity.id, updateGraph);
    this.entity.onMentionUnlinked(this.mention.id);
  }
}
