export type JsContextEntry = {
  name: string;
  type: string;
};

export type ShapeParam = {
  name: string;
  type: string[];
  required: boolean;
  context?: JsContextEntry[];
  declarations?: string[];
};

export type ActionShape = {
  type: string[];
  callable: boolean;
  params?: ShapeParam[];
  context?: JsContextEntry[];
  declarations?: string[];
  summary?: string;
  tags?: string[];
  /** For CustomAction shapes – the inner action this custom action wraps. */
  payload?: ActionShape;
};
