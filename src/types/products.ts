export type ProductInfoItem = {
  label: string;
  value: string;
};

export type ProductPayload = {
  html: string;
  url: string;
  title: string;
  productName: string;
  imageUrl: string;
  assetPath: string | null;
  productInfo: ProductInfoItem[];
  categories: string[];
};

export type ProductEvent = {
  path: string;
  product: ProductPayload | null;
  error?: string;
};
