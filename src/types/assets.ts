export interface AssetMetadata {
  id: string;
  name: string;
  extension: string;
  description?: string;
}

export type CreateAssetPayload = {
  name: string;
  extension: string;
  content: string;
  description?: string;
};

export type UpdateAssetPayload = {
  name?: string;
  extension?: string;
  content?: string;
  description?: string;
};
