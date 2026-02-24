export type DatasetParamDeclarationField = {
  type: string;
  description?: string;
};

export type DatasetParamItems = {
  name?: string;
  type: string[];
  required?: boolean;
  declaration?: Record<string, DatasetParamDeclarationField>;
};

export type DatasetParam = {
  name: string;
  type: string[];
  required: boolean;
  items?: DatasetParamItems;
};

export type Dataset = {
  name: string;
  type: string[];
  summary?: string;
  tags?: string[];
  params?: DatasetParam[];
};
